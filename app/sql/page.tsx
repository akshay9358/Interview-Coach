"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Terminal, 
  Play, 
  CheckSquare, 
  HelpCircle, 
  Database, 
  Check, 
  AlertCircle, 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  CheckCircle,
  Award,
  Loader2
} from "lucide-react";
import { 
  getLoggedInUser, 
  getUserProfile, 
  recordSolve, 
  UserProfile,
  getSolvedDate
} from "@/lib/db";
import { sqlProblems, SqlProblem, generateDynamicSqlProblem } from "@/lib/sqlPracticeData";

declare global {
  interface Window {
    initSqlJs?: any;
  }
}

export default function SqlPractice() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [problems, setProblems] = useState<SqlProblem[]>(sqlProblems);
  const [activeProblem, setActiveProblem] = useState<SqlProblem>(sqlProblems[0]);
  const [userQuery, setUserQuery] = useState(sqlProblems[0].initialQuery);
  const [sqlReady, setSqlReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [showSolvedSql, setShowSolvedSql] = useState(false);
  const [expectedOutput, setExpectedOutput] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [showSqlHint, setShowSqlHint] = useState(false);

  // SQLite WASM database reference
  const dbRef = useRef<any>(null);

  const displayProblems = useMemo(() => {
    if (!profile) return sqlProblems;
    
    let customList: SqlProblem[] = [];
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ic_custom_sql_problems");
      if (saved) {
        try {
          customList = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse custom sql problems:", e);
        }
      }
    }
    
    const list = [...sqlProblems, ...customList];
    let unsolvedCount = list.filter(p => !profile.solvedSql.includes(p.id)).length;
    
    let i = 0;
    while (unsolvedCount < 10 && i < 100) { // safety cap of 100
      const newId = `dyn-sql-${i}`;
      if (!list.some(p => p.id === newId)) {
        const prob = generateDynamicSqlProblem(i, newId);
        if (!profile.solvedSql.includes(prob.id)) {
          list.push(prob);
          unsolvedCount++;
        }
      }
      i++;
    }
    return list;
  }, [profile]);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setProfile(getUserProfile(user));
    }

    const handleUpdate = () => {
      if (user) {
        setProfile(getUserProfile(user));
      }
    };

    window.addEventListener("profile_updated", handleUpdate);

    // Load sql.js dynamically from CDN
    if (!window.initSqlJs) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
      script.async = true;
      script.onload = () => {
        initializeSqlEngine();
      };
      document.body.appendChild(script);
    } else {
      initializeSqlEngine();
    }

    return () => {
      // Free DB memory on unmount
      if (dbRef.current) {
        dbRef.current.close();
      }
      window.removeEventListener("profile_updated", handleUpdate);
    };
  }, []);

  // Restore selected SQL problem from localStorage on mount/profile load
  useEffect(() => {
    const savedId = localStorage.getItem("ic_selected_sql_problem_id");
    if (savedId && displayProblems.length > 0) {
      const matched = displayProblems.find(p => p.id === savedId);
      if (matched) {
        setActiveProblem(matched);
      }
    }
  }, [displayProblems]);

  const handleSelectProblem = (prob: SqlProblem) => {
    setActiveProblem(prob);
    localStorage.setItem("ic_selected_sql_problem_id", prob.id);
  };

  // Update initial query when problem changes
  useEffect(() => {
    const savedQuery = profile?.solvedSqlAnswers?.[activeProblem.id] || activeProblem.initialQuery;
    setUserQuery(savedQuery);
    setQueryResult(null);
    setSqlError(null);
    setExpectedOutput(null);
    setShowSqlHint(false);

    const solved = profile ? profile.solvedSql.includes(activeProblem.id) : false;
    if (solved) {
      setSubmitStatus({
        success: true,
        text: "Accepted! Passed all 5/5 hidden validation test cases. Review your saved query below."
      });
    } else {
      setSubmitStatus(null);
    }
    
    // Seed new database tables for the active problem
    if (sqlReady && dbRef.current) {
      seedDatabase(activeProblem);
      try {
        const res = dbRef.current.exec(activeProblem.expectedSql);
        if (res.length > 0) {
          setExpectedOutput({
            columns: res[0].columns,
            values: res[0].values
          });
        }
      } catch (err) {
        console.error("Failed to compute expected output:", err);
      }
    }
  }, [activeProblem, sqlReady, profile]);

  const initializeSqlEngine = async () => {
    try {
      if (!window.initSqlJs) return;
      const initSqlJs = window.initSqlJs;
      
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm`
      });

      // Store db instance
      dbRef.current = new SQL.Database();
      setSqlReady(true);
      
      // Seed first problem
      seedDatabase(activeProblem);
    } catch (err: any) {
      console.error("Failed to initialize sql.js engine:", err);
      setSqlError("SQL Engine failed to load. Check internet connection.");
    }
  };

  const seedDatabase = (problem: SqlProblem) => {
    try {
      if (!dbRef.current) return;
      
      // Clean start by wiping old tables if they exist
      problem.tables.forEach(table => {
        try {
          dbRef.current.run(`DROP TABLE IF EXISTS ${table.name};`);
        } catch {}
      });

      // Run seeding script
      dbRef.current.run(problem.seedSql);
    } catch (err: any) {
      console.error("Database seeding failed:", err);
      setSqlError(`Failed to seed database tables: ${err.message}`);
    }
  };

  const handleRunQuery = () => {
    if (!sqlReady || !dbRef.current) return;
    setLoading(true);
    setSqlError(null);
    setQueryResult(null);
    setSubmitStatus(null);

    setTimeout(() => {
      try {
        const res = dbRef.current.exec(userQuery);
        if (res.length > 0) {
          setQueryResult({
            columns: res[0].columns,
            values: res[0].values
          });
        } else {
          // Query executed successfully but returned empty rows
          setQueryResult({
            columns: ["Result Log"],
            values: [["Query compiled successfully. 0 rows returned."]]
          });
        }
      } catch (err: any) {
        setSqlError(err.message || "SQL Syntax Error");
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const generateHiddenTestCases = (problemId: string, iteration: number): string => {
    const cleanId = problemId.startsWith("dyn-sql-") ? "dyn-sql" : problemId;

    switch (cleanId) {
      case "nth-highest-salary":
        if (iteration === 1) {
          return `
            CREATE TABLE Employee (id INT, salary INT);
            INSERT INTO Employee (id, salary) VALUES (1, 1000);
            INSERT INTO Employee (id, salary) VALUES (2, 2000);
            INSERT INTO Employee (id, salary) VALUES (3, 3000);
            INSERT INTO Employee (id, salary) VALUES (4, 4000);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Employee (id INT, salary INT);
            INSERT INTO Employee (id, salary) VALUES (1, 500);
            INSERT INTO Employee (id, salary) VALUES (2, 500);
          `;
        }
        if (iteration === 3) {
          return `
            CREATE TABLE Employee (id INT, salary INT);
            INSERT INTO Employee (id, salary) VALUES (1, 150);
            INSERT INTO Employee (id, salary) VALUES (2, 250);
            INSERT INTO Employee (id, salary) VALUES (3, 250);
          `;
        }
        if (iteration === 4) {
          return `
            CREATE TABLE Employee (id INT, salary INT);
            INSERT INTO Employee (id, salary) VALUES (1, 90);
            INSERT INTO Employee (id, salary) VALUES (2, 80);
          `;
        }
        return `
          CREATE TABLE Employee (id INT, salary INT);
          INSERT INTO Employee (id, salary) VALUES (1, 600);
        `;

      case "dept-top-earners":
        if (iteration === 1) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
            CREATE TABLE Department (id INT, name VARCHAR(50));
            INSERT INTO Department (id, name) VALUES (1, 'Engineering');
            INSERT INTO Department (id, name) VALUES (2, 'HR');
            INSERT INTO Department (id, name) VALUES (3, 'Finance');
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Alice', 95000, 1);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (2, 'Bob', 120000, 1);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (3, 'Charlie', 50000, 2);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (4, 'David', 50000, 2);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (5, 'Eve', 110000, 3);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
            CREATE TABLE Department (id INT, name VARCHAR(50));
            INSERT INTO Department (id, name) VALUES (1, 'R&D');
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Jim', 80000, 1);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (2, 'Pam', 80000, 1);
          `;
        }
        return `
          CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
          CREATE TABLE Department (id INT, name VARCHAR(50));
          INSERT INTO Department (id, name) VALUES (1, 'Sales');
          INSERT INTO Department (id, name) VALUES (2, 'Marketing');
          INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Dwight', 90000, 1);
        `;

      case "duplicate-emails":
        if (iteration === 1) {
          return `
            CREATE TABLE Person (id INT, email VARCHAR(100));
            INSERT INTO Person (id, email) VALUES (1, 'x@y.com');
            INSERT INTO Person (id, email) VALUES (2, 'a@b.com');
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Person (id INT, email VARCHAR(100));
            INSERT INTO Person (id, email) VALUES (1, 'x@y.com');
            INSERT INTO Person (id, email) VALUES (2, 'x@y.com');
            INSERT INTO Person (id, email) VALUES (3, 'x@y.com');
          `;
        }
        return `
          CREATE TABLE Person (id INT, email VARCHAR(100));
          INSERT INTO Person (id, email) VALUES (1, 'a@b.com');
          INSERT INTO Person (id, email) VALUES (2, 'b@c.com');
          INSERT INTO Person (id, email) VALUES (3, 'a@b.com');
          INSERT INTO Person (id, email) VALUES (4, 'b@c.com');
        `;

      case "never-orders":
        if (iteration === 1) {
          return `
            CREATE TABLE Customers (id INT, name VARCHAR(50));
            CREATE TABLE Orders (id INT, customerId INT);
            INSERT INTO Customers (id, name) VALUES (1, 'A');
            INSERT INTO Customers (id, name) VALUES (2, 'B');
            INSERT INTO Orders (id, customerId) VALUES (1, 1);
            INSERT INTO Orders (id, customerId) VALUES (2, 2);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Customers (id INT, name VARCHAR(50));
            CREATE TABLE Orders (id INT, customerId INT);
            INSERT INTO Customers (id, name) VALUES (1, 'A');
            INSERT INTO Customers (id, name) VALUES (2, 'B');
          `;
        }
        return `
          CREATE TABLE Customers (id INT, name VARCHAR(50));
          CREATE TABLE Orders (id INT, customerId INT);
          INSERT INTO Customers (id, name) VALUES (10, 'X');
          INSERT INTO Customers (id, name) VALUES (20, 'Y');
          INSERT INTO Orders (id, customerId) VALUES (1, 10);
        `;

      case "consecutive-nums":
        if (iteration === 1) {
          return `
            CREATE TABLE Logs (id INT, num INT);
            INSERT INTO Logs (id, num) VALUES (1, 5);
            INSERT INTO Logs (id, num) VALUES (2, 6);
            INSERT INTO Logs (id, num) VALUES (3, 5);
            INSERT INTO Logs (id, num) VALUES (4, 6);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Logs (id INT, num INT);
            INSERT INTO Logs (id, num) VALUES (1, 9);
            INSERT INTO Logs (id, num) VALUES (2, 9);
            INSERT INTO Logs (id, num) VALUES (3, 9);
            INSERT INTO Logs (id, num) VALUES (4, 9);
          `;
        }
        return `
          CREATE TABLE Logs (id INT, num INT);
          INSERT INTO Logs (id, num) VALUES (1, 2);
          INSERT INTO Logs (id, num) VALUES (2, 2);
          INSERT INTO Logs (id, num) VALUES (3, 2);
          INSERT INTO Logs (id, num) VALUES (4, 3);
          INSERT INTO Logs (id, num) VALUES (5, 3);
          INSERT INTO Logs (id, num) VALUES (6, 3);
        `;

      case "employees-earning-more":
        if (iteration === 1) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
            INSERT INTO Employee (id, name, salary, managerId) VALUES (1, 'A', 50000, 2);
            INSERT INTO Employee (id, name, salary, managerId) VALUES (2, 'B', 60000, NULL);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
            INSERT INTO Employee (id, name, salary, managerId) VALUES (1, 'A', 70000, 2);
            INSERT INTO Employee (id, name, salary, managerId) VALUES (2, 'B', 60000, NULL);
          `;
        }
        return `
          CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
          INSERT INTO Employee (id, name, salary, managerId) VALUES (1, 'A', 50000, 2);
          INSERT INTO Employee (id, name, salary, managerId) VALUES (2, 'B', 50000, NULL);
        `;

      case "rank-scores":
        if (iteration === 1) {
          return `
            CREATE TABLE Scores (id INT, score DECIMAL(5,2));
            INSERT INTO Scores (id, score) VALUES (1, 1.0);
            INSERT INTO Scores (id, score) VALUES (2, 2.0);
            INSERT INTO Scores (id, score) VALUES (3, 3.0);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Scores (id INT, score DECIMAL(5,2));
            INSERT INTO Scores (id, score) VALUES (1, 5.0);
            INSERT INTO Scores (id, score) VALUES (2, 5.0);
            INSERT INTO Scores (id, score) VALUES (3, 5.0);
          `;
        }
        return `
          CREATE TABLE Scores (id INT, score DECIMAL(5,2));
          INSERT INTO Scores (id, score) VALUES (1, 4.0);
          INSERT INTO Scores (id, score) VALUES (2, 4.0);
          INSERT INTO Scores (id, score) VALUES (3, 3.5);
          INSERT INTO Scores (id, score) VALUES (4, 3.5);
        `;

      case "big-countries":
        if (iteration === 1) {
          return `
            CREATE TABLE World (name VARCHAR(50), continent VARCHAR(50), area INT, population INT, gdp BIGINT);
            INSERT INTO World (name, continent, area, population, gdp) VALUES ('SmallLand', 'Asia', 100, 1000, 10000);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE World (name VARCHAR(50), continent VARCHAR(50), area INT, population INT, gdp BIGINT);
            INSERT INTO World (name, continent, area, population, gdp) VALUES ('BigLand', 'Asia', 4000000, 30000000, 100000);
          `;
        }
        return `
          CREATE TABLE World (name VARCHAR(50), continent VARCHAR(50), area INT, population INT, gdp BIGINT);
          INSERT INTO World (name, continent, area, population, gdp) VALUES ('AreaBig', 'Europe', 5000000, 5000, 10000);
          INSERT INTO World (name, continent, area, population, gdp) VALUES ('PopBig', 'Africa', 10000, 45000000, 10000);
        `;

      case "classes-more-than-5":
        if (iteration === 1) {
          return `
            CREATE TABLE Courses (student VARCHAR(50), class VARCHAR(50));
            INSERT INTO Courses (student, class) VALUES ('A', 'Math');
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Courses (student VARCHAR(50), class VARCHAR(50));
            INSERT INTO Courses (student, class) VALUES ('A', 'Math');
            INSERT INTO Courses (student, class) VALUES ('B', 'Math');
            INSERT INTO Courses (student, class) VALUES ('C', 'Math');
            INSERT INTO Courses (student, class) VALUES ('D', 'Math');
            INSERT INTO Courses (student, class) VALUES ('E', 'Math');
          `;
        }
        return `
          CREATE TABLE Courses (student VARCHAR(50), class VARCHAR(50));
          INSERT INTO Courses (student, class) VALUES ('A', 'Math');
          INSERT INTO Courses (student, class) VALUES ('A', 'Math');
          INSERT INTO Courses (student, class) VALUES ('B', 'Math');
          INSERT INTO Courses (student, class) VALUES ('C', 'Math');
          INSERT INTO Courses (student, class) VALUES ('D', 'Math');
        `;

      case "rising-temperature":
        if (iteration === 1) {
          return `
            CREATE TABLE Weather (id INT, recordDate DATE, temperature INT);
            INSERT INTO Weather (id, recordDate, temperature) VALUES (1, '2026-05-20', 30);
            INSERT INTO Weather (id, recordDate, temperature) VALUES (2, '2026-05-21', 20);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Weather (id INT, recordDate DATE, temperature INT);
            INSERT INTO Weather (id, recordDate, temperature) VALUES (1, '2026-05-20', 10);
            INSERT INTO Weather (id, recordDate, temperature) VALUES (2, '2026-05-22', 20);
          `;
        }
        return `
          CREATE TABLE Weather (id INT, recordDate DATE, temperature INT);
          INSERT INTO Weather (id, recordDate, temperature) VALUES (1, '2026-05-20', 10);
          INSERT INTO Weather (id, recordDate, temperature) VALUES (2, '2026-05-21', 20);
          INSERT INTO Weather (id, recordDate, temperature) VALUES (3, '2026-05-22', 30);
        `;

      case "delete-duplicate-emails":
        if (iteration === 1) {
          return `
            CREATE TABLE Person (id INT, email VARCHAR(100));
            INSERT INTO Person (id, email) VALUES (1, 'john@example.com');
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Person (id INT, email VARCHAR(100));
            INSERT INTO Person (id, email) VALUES (5, 'john@example.com');
            INSERT INTO Person (id, email) VALUES (2, 'john@example.com');
          `;
        }
        return `
          CREATE TABLE Person (id INT, email VARCHAR(100));
          INSERT INTO Person (id, email) VALUES (1, 'a@b.com');
          INSERT INTO Person (id, email) VALUES (2, 'a@b.com');
          INSERT INTO Person (id, email) VALUES (3, 'b@c.com');
        `;

      case "sales-person":
        if (iteration === 1) {
          return `
            CREATE TABLE SalesPerson (salesId INT, name VARCHAR(50));
            CREATE TABLE Company (comId INT, name VARCHAR(50));
            CREATE TABLE Orders (orderId INT, comId INT, salesId INT);
            INSERT INTO SalesPerson (salesId, name) VALUES (1, 'John');
            INSERT INTO Company (comId, name) VALUES (1, 'BLUE');
            INSERT INTO Orders (orderId, comId, salesId) VALUES (1, 1, 1);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE SalesPerson (salesId INT, name VARCHAR(50));
            CREATE TABLE Company (comId INT, name VARCHAR(50));
            CREATE TABLE Orders (orderId INT, comId INT, salesId INT);
            INSERT INTO SalesPerson (salesId, name) VALUES (1, 'John');
            INSERT INTO Company (comId, name) VALUES (1, 'RED');
            INSERT INTO Orders (orderId, comId, salesId) VALUES (1, 1, 1);
          `;
        }
        return `
          CREATE TABLE SalesPerson (salesId INT, name VARCHAR(50));
          CREATE TABLE Company (comId INT, name VARCHAR(50));
          CREATE TABLE Orders (orderId INT, comId INT, salesId INT);
          INSERT INTO SalesPerson (salesId, name) VALUES (1, 'John');
          INSERT INTO SalesPerson (salesId, name) VALUES (2, 'Amy');
          INSERT INTO Company (comId, name) VALUES (1, 'RED');
          INSERT INTO Company (comId, name) VALUES (2, 'YELLOW');
          INSERT INTO Orders (orderId, comId, salesId) VALUES (1, 1, 1);
          INSERT INTO Orders (orderId, comId, salesId) VALUES (2, 2, 2);
        `;

      default:
        if (iteration === 1) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (10, 'A', 5000, 1);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (20, 'B', 6000, 2);
          `;
        }
        if (iteration === 2) {
          return `
            CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (100, 'X', 12000, 1);
            INSERT INTO Employee (id, name, salary, departmentId) VALUES (200, 'Y', 12000, 1);
          `;
        }
        return `
          CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
          INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'A', 9000, 5);
        `;
    }
  };

  const handleSubmitQuery = () => {
    if (!sqlReady || !dbRef.current) return;
    setLoading(true);
    setSqlError(null);
    setSubmitStatus(null);

    setTimeout(() => {
      try {
        let allPassed = true;
        let failedTestCase = -1;

        for (let t = 0; t < 5; t++) {
          // Re-create and seed database for the current test case
          // Clean start by wiping old tables if they exist
          activeProblem.tables.forEach(table => {
            try {
              dbRef.current.run(`DROP TABLE IF EXISTS ${table.name};`);
            } catch {}
          });

          // Run seed script
          const seed = t === 0 
            ? activeProblem.seedSql 
            : generateHiddenTestCases(activeProblem.id, t);
          dbRef.current.run(seed);

          // Evaluate expected query result
          const expectedRes = dbRef.current.exec(activeProblem.expectedSql);

          // Evaluate user query result
          let userRes;
          try {
            userRes = dbRef.current.exec(userQuery);
          } catch (err: any) {
            throw new Error(`Test Case ${t + 1} compilation failed: ${err.message}`);
          }

          if (userRes.length === 0 && expectedRes.length > 0) {
            allPassed = false;
            failedTestCase = t + 1;
            break;
          }

          // Deep-compare results
          const expectedData = expectedRes.length > 0 ? expectedRes[0] : null;
          const userData = userRes.length > 0 ? userRes[0] : null;
          const isMatch = compareSqlResults(expectedData, userData);
          
          if (!isMatch) {
            allPassed = false;
            failedTestCase = t + 1;
            break;
          }
        }

        // Restore active problem base database state
        seedDatabase(activeProblem);

        const passedCount = allPassed ? 5 : failedTestCase - 1;

        if (allPassed) {
          setSubmitStatus({
            success: true,
            text: `Success! Passed all ${passedCount}/5 hidden validation test cases.`
          });
          
          if (profile) {
            recordSolve(profile.username, "sql", activeProblem.id, userQuery);
            setProfile(getUserProfile(profile.username));
          }
        } else {
          setSubmitStatus({
            success: false,
            text: `Wrong Answer. Passed ${passedCount}/5 test cases. Failed on Hidden Test Case #${failedTestCase}/5.`
          });
        }
      } catch (err: any) {
        // Make sure database is restored on error
        try {
          seedDatabase(activeProblem);
        } catch {}
        setSqlError(err.message || "SQL Execution Error during evaluation");
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const compareSqlResults = (expected: any, actual: any): boolean => {
    if (!expected && !actual) return true; // Both queries correctly returned 0 rows
    if (!expected || !actual) return false;
    
    // Compare columns length
    if (expected.columns.length !== actual.columns.length) return false;

    // Compare actual row counts
    if (expected.values.length !== actual.values.length) return false;

    // Normalize sorting for matching values
    const expectedStr = JSON.stringify(expected.values.map((v: any) => v.join("|")).sort());
    const actualStr = JSON.stringify(actual.values.map((v: any) => v.join("|")).sort());

    return expectedStr === actualStr;
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main console content */}
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12 max-w-full overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10 w-full overflow-hidden">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent truncate">
              SQL Practice Console
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 truncate">Write queries against a live SQLite WebAssembly container.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span className="text-[10px] sm:text-xs text-zinc-400 bg-white/[0.04] px-2.5 py-1.5 rounded-full border border-white/5 font-semibold hidden sm:flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-violet-400" />
              SQLite WASM Active
            </span>
          </div>
        </header>

        {/* Console view layout */}
        <div className="lg:p-8 p-4 flex flex-col gap-6 max-w-4xl w-full mx-auto">
          
          {/* 1. SELECT SQL PROBLEM scrollable select list */}
          <div className="p-4 sm:p-5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Select SQL Problem</label>
            
            {/* Scrollable list of all problems (shows ~4 items, scroll to see more) */}
            <div className="space-y-1.5 max-h-[186px] overflow-y-auto pr-1">
              {/* Unsolved SQL problems */}
              {displayProblems.filter(prob => !profile.solvedSql.includes(prob.id)).map((prob) => {
                const isActive = activeProblem.id === prob.id;
                return (
                  <button
                    key={prob.id}
                    onClick={() => handleSelectProblem(prob)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                      isActive
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-inner"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="truncate pr-2">{prob.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] border shrink-0 ${
                      prob.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                      prob.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                      "border-rose-500/20 text-rose-400 bg-rose-500/5"
                    }`}>
                      {prob.difficulty}
                    </span>
                  </button>
                );
              })}

              {/* Collapsible Solved SQL Dropdown */}
              {displayProblems.filter(prob => profile.solvedSql.includes(prob.id)).length > 0 && (
                <div className="mt-3 border-t border-white/5 pt-2">
                  <button
                    onClick={() => setShowSolvedSql(!showSolvedSql)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors select-none outline-none"
                  >
                    <span>Solved Queries ({displayProblems.filter(prob => profile.solvedSql.includes(prob.id)).length})</span>
                    {showSolvedSql ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {showSolvedSql && (
                    <div className="mt-1 space-y-1.5 pl-1 animate-fadeIn max-h-[160px] overflow-y-auto pr-1">
                      {displayProblems.filter(prob => profile.solvedSql.includes(prob.id)).map((prob) => {
                        const isActive = activeProblem.id === prob.id;
                        return (
                          <button
                            key={prob.id}
                            onClick={() => handleSelectProblem(prob)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                              isActive
                                ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-inner"
                                : "text-zinc-500 hover:text-white hover:bg-white/[0.01]"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate pr-2 line-through text-zinc-600">{prob.title}</span>
                              <span className="text-[9px] text-zinc-500 font-normal mt-0.5">
                                Solved on {getSolvedDate(profile, prob.id, "sql")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] border font-semibold ${
                                prob.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                prob.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                "border-rose-500/20 text-rose-400 bg-rose-500/5"
                              }`}>
                                {prob.difficulty}
                              </span>
                              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Problem Statement & Table Schema Details Card */}
          <div className="p-4 sm:p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-400" />
              Problem Statement
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              {activeProblem.description}
            </p>

            {/* Table Schema Viewer */}
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-zinc-500" />
                Active Database Tables
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProblem.tables.map((table, tIdx) => (
                  <div key={tIdx} className="bg-black/40 border border-white/5 p-3.5 rounded-xl">
                    <span className="text-xs font-bold text-white">{table.name}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px]">
                      {table.columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex justify-between text-zinc-500">
                          <strong className="text-zinc-300 font-semibold">{col.name}</strong>
                          <span className="uppercase">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Output Viewer */}
            {expectedOutput && (
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  Expected Output Table
                </h4>
                <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {expectedOutput.columns.map((col, idx) => (
                            <th key={idx} className="p-2 font-bold text-zinc-300 uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {expectedOutput.values.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01]">
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="p-2 text-zinc-400 font-mono">
                                {val === null || val === undefined ? "NULL" : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Hint Box (Collapsible Toggle) */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <button
                onClick={() => setShowSqlHint(!showSqlHint)}
                className="flex items-center justify-between w-full text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors py-1 select-none outline-none"
              >
                <span>HELPFUL HINT</span>
                {showSqlHint ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showSqlHint && (
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium bg-black/30 border border-white/5 p-3 rounded-xl animate-fadeIn">
                  {activeProblem.hint}
                </p>
              )}
            </div>
          </div>

          {/* 3. SQL Code Editor Terminal */}
          <div className="p-5 rounded-2xl border border-white/5 bg-zinc-950 flex flex-col shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 text-xs font-semibold text-zinc-500">
              <span>SQL Practice Console</span>
              <span className="text-[10px] text-violet-400">PostgreSQL / SQLite dialect</span>
            </div>

            {/* Code TextArea */}
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full h-64 bg-black/60 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
              spellCheck={false}
            />

            {/* CTA buttons */}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={handleRunQuery}
                disabled={loading || !sqlReady}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all select-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>Run Query</span>
              </button>

              <button
                onClick={handleSubmitQuery}
                disabled={loading || !sqlReady}
                className="px-4 py-2.5 rounded-xl bg-violet-600/90 hover:bg-violet-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-violet-600/10 select-none disabled:opacity-50"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Submit Code</span>
              </button>
            </div>
          </div>

          {/* 4. Error notifications */}
          {sqlError && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-mono leading-relaxed">{sqlError}</span>
            </div>
          )}

          {/* 5. Success/Failure submission states (Accepted / Wrong Answer Banner) */}
          {submitStatus && (
            <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
              submitStatus.success
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-lg shadow-emerald-500/5"
                : "border-red-500/20 bg-red-500/5 text-red-400 shadow-lg shadow-red-500/5"
            }`}>
              {submitStatus.success ? <Check className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <div className="flex-1">
                <strong className="font-bold block mb-0.5">{submitStatus.success ? "Accepted!" : "Wrong Answer"}</strong>
                <span className="font-medium text-zinc-400">{submitStatus.text}</span>
              </div>
              {submitStatus.success && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md font-bold flex items-center gap-0.5 shrink-0 text-emerald-400">
                  <Award className="h-3 w-3 fill-current" />
                  <span>+25 XP</span>
                </span>
              )}
            </div>
          )}

          {/* 6. Tabular Output viewer */}
          {queryResult && (
            <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-3 max-h-96 overflow-y-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Query Result Table</span>
              <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-400 font-semibold select-none">
                      {queryResult.columns.map((col, idx) => (
                        <th key={idx} className="p-3 font-semibold uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.values.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-3 text-zinc-300 font-medium font-mono">
                            {val === null || val === undefined ? "NULL" : val.toString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
