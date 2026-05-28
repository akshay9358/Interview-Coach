export interface SqlProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  tables: {
    name: string;
    schema: string;
    columns: { name: string; type: string }[];
  }[];
  seedSql: string; // SQL queries to build and seed tables
  expectedSql: string; // The correct answer SQL query
  initialQuery: string; // Default text in query editor
  hint: string;
}

export const sqlProblems: SqlProblem[] = [
  {
    id: "nth-highest-salary",
    title: "Second Highest Salary",
    difficulty: "Medium",
    description: "Write a SQL query to find the second highest salary from the `Employee` table. If there is no second highest salary, the query should return `null` (or an empty result).",
    tables: [
      {
        name: "Employee",
        schema: "Employee(id INT, salary INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "salary", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Employee (id INT, salary INT);
      INSERT INTO Employee (id, salary) VALUES (1, 100);
      INSERT INTO Employee (id, salary) VALUES (2, 200);
      INSERT INTO Employee (id, salary) VALUES (3, 300);
    `,
    expectedSql: "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    initialQuery: "-- Write your query here\nSELECT ",
    hint: "You can find the maximum salary that is strictly less than the overall maximum salary."
  },
  {
    id: "dept-top-earners",
    title: "Department Highest Salary",
    difficulty: "Medium",
    description: "Write a SQL query to find employees who have the highest salary in each of the departments. Your query should return a table containing: Department Name, Employee Name, and Salary.",
    tables: [
      {
        name: "Employee",
        schema: "Employee(id INT, name VARCHAR, salary INT, departmentId INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "name", type: "VARCHAR" },
          { name: "salary", type: "INT" },
          { name: "departmentId", type: "INT" }
        ]
      },
      {
        name: "Department",
        schema: "Department(id INT, name VARCHAR)",
        columns: [
          { name: "id", type: "INT" },
          { name: "name", type: "VARCHAR" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
      CREATE TABLE Department (id INT, name VARCHAR(50));
      
      INSERT INTO Department (id, name) VALUES (1, 'IT');
      INSERT INTO Department (id, name) VALUES (2, 'Sales');
      
      INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1);
      INSERT INTO Employee (id, name, salary, departmentId) VALUES (2, 'Henry', 80000, 2);
      INSERT INTO Employee (id, name, salary, departmentId) VALUES (3, 'Sam', 60000, 2);
      INSERT INTO Employee (id, name, salary, departmentId) VALUES (4, 'Max', 90000, 1);
      INSERT INTO Employee (id, name, salary, departmentId) VALUES (5, 'Janet', 69000, 1);
    `,
    expectedSql: `
      SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
      FROM Employee e
      JOIN Department d ON e.departmentId = d.id
      WHERE (e.departmentId, e.salary) IN (
        SELECT departmentId, MAX(salary) FROM Employee GROUP BY departmentId
      );
    `,
    initialQuery: "-- Find department top earners\nSELECT ",
    hint: "Use a subquery to find the maximum salary grouped by departmentId, and then filter the Employee table based on those (departmentId, salary) pairs."
  },
  {
    id: "duplicate-emails",
    title: "Duplicate Emails",
    difficulty: "Easy",
    description: "Write a SQL query to find all duplicate emails in a table named `Person`. You should return only the distinct duplicate emails.",
    tables: [
      {
        name: "Person",
        schema: "Person(id INT, email VARCHAR)",
        columns: [
          { name: "id", type: "INT" },
          { name: "email", type: "VARCHAR" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Person (id INT, email VARCHAR(100));
      INSERT INTO Person (id, email) VALUES (1, 'a@b.com');
      INSERT INTO Person (id, email) VALUES (2, 'c@d.com');
      INSERT INTO Person (id, email) VALUES (3, 'a@b.com');
    `,
    expectedSql: "SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;",
    initialQuery: "-- Select duplicate emails\nSELECT ",
    hint: "Use GROUP BY email and filter the groups using HAVING COUNT(*) > 1."
  },
  {
    id: "never-orders",
    title: "Customers Who Never Order",
    difficulty: "Easy",
    description: "Write a SQL query to find all customers who never order anything. You should return the list of customer names under the column title `Customers`.",
    tables: [
      {
        name: "Customers",
        schema: "Customers(id INT, name VARCHAR)",
        columns: [
          { name: "id", type: "INT" },
          { name: "name", type: "VARCHAR" }
        ]
      },
      {
        name: "Orders",
        schema: "Orders(id INT, customerId INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "customerId", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Customers (id INT, name VARCHAR(50));
      CREATE TABLE Orders (id INT, customerId INT);
      
      INSERT INTO Customers (id, name) VALUES (1, 'Joe');
      INSERT INTO Customers (id, name) VALUES (2, 'Henry');
      INSERT INTO Customers (id, name) VALUES (3, 'Sam');
      INSERT INTO Customers (id, name) VALUES (4, 'Max');
      
      INSERT INTO Orders (id, customerId) VALUES (1, 3);
      INSERT INTO Orders (id, customerId) VALUES (2, 1);
    `,
    expectedSql: "SELECT name AS Customers FROM Customers WHERE id NOT IN (SELECT customerId FROM Orders WHERE customerId IS NOT NULL);",
    initialQuery: "-- Find customers who never ordered\nSELECT ",
    hint: "Use a subquery with NOT IN or a LEFT JOIN with a WHERE IS NULL check on the Orders table."
  },
  {
    id: "consecutive-nums",
    title: "Consecutive Numbers",
    difficulty: "Hard",
    description: "Write a SQL query to find all numbers that appear at least three times consecutively in the `Logs` table. Return the result column as `ConsecutiveNums`.",
    tables: [
      {
        name: "Logs",
        schema: "Logs(id INT, num INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "num", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Logs (id INT, num INT);
      INSERT INTO Logs (id, num) VALUES (1, 1);
      INSERT INTO Logs (id, num) VALUES (2, 1);
      INSERT INTO Logs (id, num) VALUES (3, 1);
      INSERT INTO Logs (id, num) VALUES (4, 2);
      INSERT INTO Logs (id, num) VALUES (5, 1);
      INSERT INTO Logs (id, num) VALUES (6, 2);
      INSERT INTO Logs (id, num) VALUES (7, 2);
    `,
    expectedSql: `
      SELECT DISTINCT l1.num AS ConsecutiveNums
      FROM Logs l1, Logs l2, Logs l3
      WHERE l2.id = l1.id + 1
        AND l3.id = l2.id + 1
        AND l1.num = l2.num
        AND l2.num = l3.num;
    `,
    initialQuery: "-- Find consecutive numbers appearing at least 3 times\nSELECT ",
    hint: "You can perform self-joins on the Logs table matching records where id matches recursively (l1.id + 1 = l2.id, l2.id + 1 = l3.id) and the numbers are equal."
  },
  {
    id: "employees-earning-more",
    title: "Employees Earning More Than Managers",
    difficulty: "Easy",
    description: "Write an SQL query to find the employees who earn more than their managers. Return employee names under column title `Employee`.",
    tables: [
      {
        name: "Employee",
        schema: "Employee(id INT, name VARCHAR, salary INT, managerId INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "name", type: "VARCHAR" },
          { name: "salary", type: "INT" },
          { name: "managerId", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, managerId INT);
      INSERT INTO Employee (id, name, salary, managerId) VALUES (1, 'Joe', 70000, 3);
      INSERT INTO Employee (id, name, salary, managerId) VALUES (2, 'Henry', 80000, 4);
      INSERT INTO Employee (id, name, salary, managerId) VALUES (3, 'Sam', 60000, NULL);
      INSERT INTO Employee (id, name, salary, managerId) VALUES (4, 'Max', 90000, NULL);
    `,
    expectedSql: "SELECT e1.name AS Employee FROM Employee e1 JOIN Employee e2 ON e1.managerId = e2.id WHERE e1.salary > e2.salary;",
    initialQuery: "-- Find employees earning more than managers\nSELECT ",
    hint: "Perform a self-join on the Employee table where the managerId of the first matches the id of the second, then filter where salary is higher."
  },
  {
    id: "rank-scores",
    title: "Rank Scores",
    difficulty: "Medium",
    description: "Write an SQL query to rank scores. If there is a tie between two scores, both should have the same ranking. After a tie, the next ranking number should be the next consecutive integer value (i.e., DENSE_RANK()). Return results ordered by score in descending order.",
    tables: [
      {
        name: "Scores",
        schema: "Scores(id INT, score DECIMAL)",
        columns: [
          { name: "id", type: "INT" },
          { name: "score", type: "DECIMAL" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Scores (id INT, score DECIMAL(5,2));
      INSERT INTO Scores (id, score) VALUES (1, 3.50);
      INSERT INTO Scores (id, score) VALUES (2, 3.65);
      INSERT INTO Scores (id, score) VALUES (3, 4.00);
      INSERT INTO Scores (id, score) VALUES (4, 3.85);
      INSERT INTO Scores (id, score) VALUES (5, 4.00);
      INSERT INTO Scores (id, score) VALUES (6, 3.65);
    `,
    expectedSql: "SELECT score, DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank' FROM Scores ORDER BY score DESC;",
    initialQuery: "-- Rank scores in descending order using dense ranking\nSELECT ",
    hint: "Use the window function DENSE_RANK() OVER (ORDER BY score DESC) to rank scores."
  },
  {
    id: "big-countries",
    title: "Big Countries",
    difficulty: "Easy",
    description: "A country is big if it has an area of more than 3 million sq km, or it has a population of more than 25 million. Write an SQL query to report the name, population, and area of the big countries.",
    tables: [
      {
        name: "World",
        schema: "World(name VARCHAR, continent VARCHAR, area INT, population INT, gdp BIGINT)",
        columns: [
          { name: "name", type: "VARCHAR" },
          { name: "continent", type: "VARCHAR" },
          { name: "area", type: "INT" },
          { name: "population", type: "INT" },
          { name: "gdp", type: "BIGINT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE World (name VARCHAR(50), continent VARCHAR(50), area INT, population INT, gdp BIGINT);
      INSERT INTO World (name, continent, area, population, gdp) VALUES ('Afghanistan', 'Asia', 652230, 25500100, 20343000000);
      INSERT INTO World (name, continent, area, population, gdp) VALUES ('Albania', 'Europe', 28748, 2831741, 12960000000);
      INSERT INTO World (name, continent, area, population, gdp) VALUES ('Algeria', 'Africa', 2381741, 37100000, 188681000000);
      INSERT INTO World (name, continent, area, population, gdp) VALUES ('Andorra', 'Europe', 468, 78115, 3712000000);
      INSERT INTO World (name, continent, area, population, gdp) VALUES ('Angola', 'Africa', 1246700, 20609294, 100990000000);
    `,
    expectedSql: "SELECT name, population, area FROM World WHERE area > 3000000 OR population > 25000000;",
    initialQuery: "-- Select name, population, area for big countries\nSELECT ",
    hint: "Use a simple WHERE clause with OR to filter by area or population."
  },
  {
    id: "classes-more-than-5",
    title: "Classes More Than 5 Students",
    difficulty: "Easy",
    description: "Write an SQL query to report all the classes that have at least five students. Return class column.",
    tables: [
      {
        name: "Courses",
        schema: "Courses(student VARCHAR, class VARCHAR)",
        columns: [
          { name: "student", type: "VARCHAR" },
          { name: "class", type: "VARCHAR" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Courses (student VARCHAR(50), class VARCHAR(50));
      INSERT INTO Courses (student, class) VALUES ('A', 'Math');
      INSERT INTO Courses (student, class) VALUES ('B', 'English');
      INSERT INTO Courses (student, class) VALUES ('C', 'Math');
      INSERT INTO Courses (student, class) VALUES ('D', 'Biology');
      INSERT INTO Courses (student, class) VALUES ('E', 'Math');
      INSERT INTO Courses (student, class) VALUES ('F', 'Computer');
      INSERT INTO Courses (student, class) VALUES ('G', 'Math');
      INSERT INTO Courses (student, class) VALUES ('H', 'Math');
      INSERT INTO Courses (student, class) VALUES ('I', 'Math');
    `,
    expectedSql: "SELECT class FROM Courses GROUP BY class HAVING COUNT(DISTINCT student) >= 5;",
    initialQuery: "-- Find classes with 5+ students\nSELECT ",
    hint: "Group by class and use HAVING COUNT(DISTINCT student) >= 5 to filter classes."
  },
  {
    id: "rising-temperature",
    title: "Rising Temperature",
    difficulty: "Medium",
    description: "Write an SQL query to find all dates' Id with higher temperatures compared to its previous dates (yesterday). Note: records are linked by julian date or day calculations.",
    tables: [
      {
        name: "Weather",
        schema: "Weather(id INT, recordDate DATE, temperature INT)",
        columns: [
          { name: "id", type: "INT" },
          { name: "recordDate", type: "DATE" },
          { name: "temperature", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Weather (id INT, recordDate DATE, temperature INT);
      INSERT INTO Weather (id, recordDate, temperature) VALUES (1, '2026-05-20', 10);
      INSERT INTO Weather (id, recordDate, temperature) VALUES (2, '2026-05-21', 25);
      INSERT INTO Weather (id, recordDate, temperature) VALUES (3, '2026-05-22', 20);
      INSERT INTO Weather (id, recordDate, temperature) VALUES (4, '2026-05-23', 30);
    `,
    expectedSql: `
      SELECT w1.id FROM Weather w1, Weather w2
      WHERE julianday(w1.recordDate) - julianday(w2.recordDate) = 1
        AND w1.temperature > w2.temperature;
    `,
    initialQuery: "-- Select ids with rising temperature compared to yesterday\nSELECT ",
    hint: "Use julianday(w1.recordDate) - julianday(w2.recordDate) = 1 inside a self-join to match consecutive days and check w1.temperature > w2.temperature."
  },
  {
    id: "delete-duplicate-emails",
    title: "Delete Duplicate Emails",
    difficulty: "Easy",
    description: "Write an SQL query to find the minimum Id for each unique email. We want to keep only the row with the smallest Id for each unique email address. Return the list of unique IDs and Emails.",
    tables: [
      {
        name: "Person",
        schema: "Person(id INT, email VARCHAR)",
        columns: [
          { name: "id", type: "INT" },
          { name: "email", type: "VARCHAR" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE Person (id INT, email VARCHAR(100));
      INSERT INTO Person (id, email) VALUES (1, 'john@example.com');
      INSERT INTO Person (id, email) VALUES (2, 'bob@example.com');
      INSERT INTO Person (id, email) VALUES (3, 'john@example.com');
    `,
    expectedSql: "SELECT MIN(id) AS id, email FROM Person GROUP BY email;",
    initialQuery: "-- Find minimum id for each unique email\nSELECT ",
    hint: "Use GROUP BY email along with MIN(id) to select the smallest id for each email."
  },
  {
    id: "sales-person",
    title: "Sales Person",
    difficulty: "Hard",
    description: "Write an SQL query to report the names of all the salespersons who did not have any orders related to the company 'RED'. Return the column name.",
    tables: [
      {
        name: "SalesPerson",
        schema: "SalesPerson(salesId INT, name VARCHAR, salary INT, commissionRate INT, hireDate DATE)",
        columns: [
          { name: "salesId", type: "INT" },
          { name: "name", type: "VARCHAR" }
        ]
      },
      {
        name: "Company",
        schema: "Company(comId INT, name VARCHAR, city VARCHAR)",
        columns: [
          { name: "comId", type: "INT" },
          { name: "name", type: "VARCHAR" }
        ]
      },
      {
        name: "Orders",
        schema: "Orders(orderId INT, orderDate DATE, comId INT, salesId INT, amount INT)",
        columns: [
          { name: "orderId", type: "INT" },
          { name: "comId", type: "INT" },
          { name: "salesId", type: "INT" }
        ]
      }
    ],
    seedSql: `
      CREATE TABLE SalesPerson (salesId INT, name VARCHAR(50));
      CREATE TABLE Company (comId INT, name VARCHAR(50));
      CREATE TABLE Orders (orderId INT, comId INT, salesId INT);
      
      INSERT INTO SalesPerson (salesId, name) VALUES (1, 'John');
      INSERT INTO SalesPerson (salesId, name) VALUES (2, 'Amy');
      INSERT INTO SalesPerson (salesId, name) VALUES (3, 'Mark');
      INSERT INTO SalesPerson (salesId, name) VALUES (4, 'Pam');
      INSERT INTO SalesPerson (salesId, name) VALUES (5, 'Alex');
      
      INSERT INTO Company (comId, name) VALUES (1, 'RED');
      INSERT INTO Company (comId, name) VALUES (2, 'YELLOW');
      
      INSERT INTO Orders (orderId, comId, salesId) VALUES (1, 1, 1);
      INSERT INTO Orders (orderId, comId, salesId) VALUES (2, 1, 4);
      INSERT INTO Orders (orderId, comId, salesId) VALUES (3, 2, 2);
    `,
    expectedSql: "SELECT name FROM SalesPerson WHERE salesId NOT IN (SELECT salesId FROM Orders o JOIN Company c ON o.comId = c.comId WHERE c.name = 'RED');",
    initialQuery: "-- Find salesperson names with no 'RED' orders\nSELECT ",
    hint: "Use a subquery to find all salesId who have orders with Company name 'RED', then query the SalesPerson names not in that set."
  }
];

export function generateDynamicSqlProblem(index: number, id: string): SqlProblem {
  const pool = [
    {
      title: "Average Salary by Department",
      difficulty: "Easy" as const,
      description: "Write an SQL query to find the average salary of employees in each department. Return department ID and their average salary as 'AverageSalary'.",
      tables: [
        {
          name: "Employee",
          schema: "Employee(id INT, name VARCHAR, salary INT, departmentId INT)",
          columns: [
            { name: "id", type: "INT" },
            { name: "name", type: "VARCHAR" },
            { name: "salary", type: "INT" },
            { name: "departmentId", type: "INT" }
          ]
        }
      ],
      seedSql: `
        CREATE TABLE Employee (id INT, name VARCHAR(50), salary INT, departmentId INT);
        INSERT INTO Employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1);
        INSERT INTO Employee (id, name, salary, departmentId) VALUES (2, 'Henry', 80000, 2);
        INSERT INTO Employee (id, name, salary, departmentId) VALUES (3, 'Sam', 60000, 2);
        INSERT INTO Employee (id, name, salary, departmentId) VALUES (4, 'Max', 90000, 1);
      `,
      expectedSql: "SELECT departmentId, AVG(salary) AS AverageSalary FROM Employee GROUP BY departmentId;",
      initialQuery: "-- Select departmentId and average salary\nSELECT ",
      hint: "Use GROUP BY departmentId and AVG(salary) window aggregator."
    },
    {
      title: "Customers with High Value Orders",
      difficulty: "Medium" as const,
      description: "Write an SQL query to find the names of customers who have placed at least one order with an amount greater than 500. Return customer names as 'CustomerName'.",
      tables: [
        {
          name: "Customers",
          schema: "Customers(id INT, name VARCHAR)",
          columns: [
            { name: "id", type: "INT" },
            { name: "name", type: "VARCHAR" }
          ]
        },
        {
          name: "Orders",
          schema: "Orders(id INT, customerId INT, amount INT)",
          columns: [
            { name: "id", type: "INT" },
            { name: "customerId", type: "INT" },
            { name: "amount", type: "INT" }
          ]
        }
      ],
      seedSql: `
        CREATE TABLE Customers (id INT, name VARCHAR(50));
        CREATE TABLE Orders (id INT, customerId INT, amount INT);
        INSERT INTO Customers (id, name) VALUES (1, 'Joe');
        INSERT INTO Customers (id, name) VALUES (2, 'Henry');
        INSERT INTO Customers (id, name) VALUES (3, 'Sam');
        INSERT INTO Orders (id, customerId, amount) VALUES (1, 1, 600);
        INSERT INTO Orders (id, customerId, amount) VALUES (2, 2, 300);
        INSERT INTO Orders (id, customerId, amount) VALUES (3, 3, 700);
      `,
      expectedSql: "SELECT DISTINCT name AS CustomerName FROM Customers c JOIN Orders o ON c.id = o.customerId WHERE o.amount > 500;",
      initialQuery: "-- Find customers with orders > 500\nSELECT ",
      hint: "JOIN Customers and Orders on customerId, then filter by amount > 500."
    }
  ];

  const template = pool[index % pool.length];
  return {
    ...template,
    id,
    title: `${template.title} #${index + 1}`
  };
}
