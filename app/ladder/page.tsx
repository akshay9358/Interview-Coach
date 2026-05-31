"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  Flame, 
  Award, 
  CheckCircle, 
  HelpCircle, 
  Terminal, 
  Puzzle, 
  Code, 
  ArrowRight, 
  Check, 
  PlusCircle, 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Zap,
  Timer as TimerIcon,
  Clock,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid 
} from "recharts";
import { getLoggedInUser, getUserProfile, saveUserProfile, getLocalTodayStr, UserProfile } from "@/lib/db";
import { PracticeProblem } from "@/lib/apiSync";
import { SqlProblem } from "@/lib/sqlPracticeData";
import { Puzzle as PuzzleType } from "@/lib/puzzleData";

interface LadderProblem {
  id: string;
  title: string;
  platform: "Codeforces" | "LeetCode" | "SQL" | "Puzzle";
  difficulty: "Easy" | "Medium" | "Hard";
  details: string;
  hint: string;
  answer: string;
  problemUrl?: string;
  accepted?: boolean;
}

// Curated pool of unique dynamic problems for Codeforces/Leetcode
const CF_DSA_EASY_PROBLEMS = [
  { title: "Next Round", details: "Contestant who earns a score equal to or greater than the k-th place contestant's score will advance to the next round.", hint: "Check if scores are strictly positive and compare index elements.", answer: "Read scores, check a[k-1] and loop to count satisfying items.", url: "https://codeforces.com/problemset/problem/158/A" },
  { title: "Team", details: "Three friends decide to solve a problem together if at least two of them are sure about the solution.", hint: "Read three integers per line, sum them up, and check if the sum >= 2.", answer: "Loop through lines, check if (a + b + c) >= 2, increment count.", url: "https://codeforces.com/problemset/problem/231/A" },
  { title: "Bit++", details: "Execute a sequence of increment and decrement operations represented as ++X, X++, --X, or X--.", hint: "Check if the middle character of the instruction is '+'.", answer: "Iterate instructions, if instr[1] == '+' x++ else x--.", url: "https://codeforces.com/problemset/problem/282/A" },
  { title: "Domino piling", details: "Given a board of size M x N, find the maximum number of standard 2x1 dominoes that can be placed on it.", hint: "Simple area division. The answer is floor((M * N) / 2).", answer: "Return (m * n) // 2.", url: "https://codeforces.com/problemset/problem/50/A" },
  { title: "Two Sum", details: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.", hint: "Use a hash map to store elements and their indices for O(1) lookups.", answer: "Map visited: val -> index. Check if target - val is in map.", url: "https://leetcode.com/problems/two-sum/" },
  { title: "Palindrome Number", details: "Determine whether an integer is a palindrome. An integer is a palindrome when it reads the same backward as forward.", hint: "Rebuild the integer backwards by modulo 10 extraction and compare.", answer: "Return original == reversed (handle negatives and multiples of 10).", url: "https://leetcode.com/problems/palindrome-number/" },
  { title: "Petya and Strings", details: "Compare two strings lexicographically, ignoring the case of characters.", hint: "Convert both strings to lowercase and compare character by character.", answer: "ToLower(s1) == ToLower(s2) ? 0 : (s1 < s2 ? -1 : 1).", url: "https://codeforces.com/problemset/problem/112/A" },
  { title: "Beautiful Matrix", details: "Determine minimum moves to shift the single active 1 to the center of a 5x5 matrix grid.", hint: "Subtract index coordinates from the center indexes (2,2) and add absolute results.", answer: "Return abs(row - 2) + abs(col - 2);", url: "https://codeforces.com/problemset/problem/263/A" },
  { title: "Way Too Long Words", details: "Replace words strictly longer than 10 letters with their standard localized abbreviations.", hint: "Keep first and last char, insert word.length - 2 in the middle.", answer: "Return word[0] + String(word.length - 2) + word[word.length - 1];", url: "https://codeforces.com/problemset/problem/71/A" },
  { title: "Helpful Maths", details: "Rearrange a sum string containing numbers 1, 2, and 3 into non-decreasing order.", hint: "Split numbers, sort, and join back with '+' operators.", answer: "split('+').sort().join('+')", url: "https://codeforces.com/problemset/problem/339/A" },
  { title: "Word Capitalization", details: "Capitalize only the first letter of a given word string.", hint: "Select string[0].toUpperCase() and concatenate the remaining slice.", answer: "s[0].toUpperCase() + s.slice(1)", url: "https://codeforces.com/problemset/problem/266/A" },
  { title: "Boy or Girl", details: "Determine user gender based on the count of unique characters in the username string.", hint: "Gather characters in a Set, check if set.size % 2 == 0.", answer: "new Set(username).size % 2 === 0 ? 'CHAT WITH HER!' : 'IGNORE HIM!'", url: "https://codeforces.com/problemset/problem/236/A" }
];

const CF_DSA_MEDIUM_PROBLEMS = [
  { title: "Cheap Travel", details: "Find the minimum cost to buy n rides if you can buy single-ride tickets or m-ride special tickets.", hint: "Compare greedy options: all single rides, combination, or extra m-ride ticket.", answer: "min(n * a, (n / m) * b + (n % m) * a, (n / m + 1) * b)", url: "https://codeforces.com/problemset/problem/466/A" },
  { title: "BerSU Ball", details: "Find the maximum number of pairs of boys and girls that can dance together if absolute skill difference is at most 1.", hint: "Sort both arrays and apply a two-pointer approach to match pairs.", answer: "Sort(A), Sort(B). Two pointers i, j. If abs(A[i]-B[j]) <= 1: match, else advance smaller.", url: "https://codeforces.com/problemset/problem/489/B" },
  { title: "Flipping Game", details: "Choose a segment of 0s and 1s, flip them, and maximize the total number of 1s in the array.", hint: "Use Kadane's algorithm by treating 0 as +1 and 1 as -1 to find max subarray.", answer: "Transform array, run Kadane to find max gain, add to original count of 1s.", url: "https://codeforces.com/problemset/problem/327/A" },
  { title: "Container With Most Water", details: "Find two lines that together with the x-axis form a container, such that the container contains the most water.", hint: "Use two pointers at start and end. Move the pointer pointing to the shorter line inward.", answer: "While left < right: area = min(H[l], H[r]) * (r - l). Move min pointer.", url: "https://leetcode.com/problems/container-with-most-water/" },
  { title: "IQ test", details: "Find the index of the number that differs from the others in evenness.", hint: "Track counts and last indices of even and odd numbers.", answer: "Loop through items, count evens vs odds and output the single outlier index.", url: "https://codeforces.com/problemset/problem/25/A" },
  { title: "Longest Substring Without Repeating", details: "Find the length of the longest substring without repeating characters.", hint: "Use a sliding window map keeping track of last indices of characters.", answer: "Slide window right pointer, update left index to max(left, last_seen[char] + 1).", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { title: "Given Length and Sum of Digits", details: "Find the smallest and largest numbers of length m and digit sum s.", hint: "Use greedy choices placing 9s or ensuring a valid starting non-zero digit.", answer: "Distribute digits left-to-right greedily for max, right-to-left for min.", url: "https://codeforces.com/problemset/problem/489/C" },
  { title: "Fancy Fence", details: "Determine if it's possible to build a regular polygon with a given interior angle.", hint: "Regular polygon interior angle is (n-2)*180/n. Thus, 360 / (180 - angle) must be an integer.", answer: "360 % (180 - angle) === 0 ? 'YES' : 'NO'", url: "https://codeforces.com/problemset/problem/270/A" },
  { title: "T-primes", details: "Determine if an integer has exactly three positive divisors.", hint: "divisors == 3 if and only if the number is the square of a prime number.", answer: "Check if sqrt(x) is an integer and prime using a fast sieve.", url: "https://codeforces.com/problemset/problem/230/B" },
  { title: "Vanya and Lanterns", details: "Find the minimum light radius needed to illuminate a street of length l using a given list of lanterns.", hint: "Compute gaps between adjacent lanterns. Corner gaps are key bounds.", answer: "max(gap_max / 2, lamp[0], length - lamp[n-1]);", url: "https://codeforces.com/problemset/problem/492/B" },
  { title: "3Sum", details: "Find all unique triplets in the array which gives the sum of zero.", hint: "Sort the array, iterate and apply two-pointer search on the remaining subarray.", answer: "Sort(A). Loop i. Left=i+1, Right=n-1. If sum==0 record, skip duplicates.", url: "https://leetcode.com/problems/3sum/" },
  { title: "Merge Intervals", details: "Given an array of intervals, merge all overlapping intervals.", hint: "Sort intervals by start time, then merge overlaps progressively in a loop.", answer: "Sort(int). Iter, if current.start <= last.end: last.end = max(last.end, current.end).", url: "https://leetcode.com/problems/merge-intervals/" }
];

const CF_DSA_HARD_PROBLEMS = [
  { title: "Cut Ribbon", details: "Cut a ribbon of length n into maximum number of pieces of lengths a, b, or c.", hint: "Formulate a dynamic programming dp[i] array initialized to -infinity, dp[0]=0.", answer: "dp[i] = max(dp[i-a], dp[i-b], dp[i-c]) + 1. Return dp[n].", url: "https://codeforces.com/problemset/problem/189/A" },
  { title: "Kefa and Park", details: "Find the number of leaf nodes in a tree reachable from the root without passing through more than m consecutive nodes with cats.", hint: "Run DFS, passing the count of consecutive cat nodes encountered along the path.", answer: "If cats > m: return. If leaf node: increment count. Recurse children.", url: "https://codeforces.com/problemset/problem/580/C" },
  { title: "Boredom", details: "Maximize points by choosing an element A_i, deleting it to gain its points, but deleting all elements equal to A_i-1 and A_i+1.", hint: "This reduces to House Robber. dp[i] = max(dp[i-1], dp[i-2] + i * count[i]).", answer: "Compute counts, iterate from 2 to max_val applying state space reduction.", url: "https://codeforces.com/problemset/problem/455/A" },
  { title: "Trapping Rain Water", details: "Compute how much water a 3D elevation map can trap after raining.", hint: "Use two pointers maintaining maximum heights from left and right boundaries.", answer: "Accumulate max(0, min(left_max, right_max) - height[i]).", url: "https://leetcode.com/problems/trapping-rain-water/" },
  { title: "Merge k Sorted Lists", details: "Merge k sorted linked lists and return it as one sorted list.", hint: "Use a min-heap (priority queue) to keep track of the head of each list.", answer: "Push heads to PQ, pop min, append to result, push next element.", url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  { title: "Tetrahedron", details: "Find the number of paths of length n from a single vertex in a tetrahedron back to itself.", hint: "Let dp[i][0] be ways to be at root vertex, dp[i][1] at other vertices.", answer: "dp[i][0] = 3 * dp[i-1][1]; dp[i][1] = dp[i-1][0] + 2 * dp[i-1][1].", url: "https://codeforces.com/problemset/problem/166/E" },
  { title: "Registration System", details: "Maintain user registration usernames, appending sequence indices for duplicates.", hint: "Use a hash map to keep track of username occurrences.", answer: "Map visited: name -> count. If count > 0 print name + count++.", url: "https://codeforces.com/problemset/problem/4/C" },
  { title: "Two Substrings", details: "Determine if a string contains two non-overlapping substrings 'AB' and 'BA'.", hint: "Search for 'AB' first then search for 'BA' starting after it, then check vice-versa.", answer: "Return (s.indexOf('AB') < s.lastIndexOf('BA') - 1) or reciprocal.", url: "https://codeforces.com/problemset/problem/550/A" },
  { title: "Woodcutters", details: "Find the maximum number of trees that can be felled without overlapping other trees or coordinates.", hint: "Greedy choice: fell left if space available, otherwise fell right if space available.", answer: "Iterate trees, track last coordinate boundary, greedily try fell left, then right.", url: "https://codeforces.com/problemset/problem/545/C" },
  { title: "Unique Paths II", details: "Determine total paths from top-left to bottom-right of a grid with obstacles present.", hint: "Use DP grid dp[i][j] = dp[i-1][j] + dp[i][j-1], setting dp=0 for obstacles.", answer: "dp[i][j] = grid[i][j] == 1 ? 0 : dp[i-1][j] + dp[i][j-1]", url: "https://leetcode.com/problems/unique-paths-ii/" },
  { title: "Median of Two Sorted Arrays", details: "Find the median of two sorted arrays in O(log(min(M,N))) overall time.", hint: "Perform binary search on partition indexes of the smaller array.", answer: "Find partition index such that maxLeft <= minRight on both sides.", url: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
  { title: "Regular Expression Matching", details: "Support matching characters '.' and '*'.", hint: "Formulate DP state dp[i][j] matching patterns with '*' lookaheads.", answer: "If pattern[j-1] == '*': dp[i][j] = dp[i][j-2] or (matches && dp[i-1][j])", url: "https://leetcode.com/problems/regular-expression-matching/" }
];

const SQL_POOL = [
  { title: "Delete Duplicate Emails", details: "Write an SQL query to delete all duplicate email entries, keeping only unique emails with the smallest Id.", hint: "Use DELETE with a self-join comparing ids.", answer: "DELETE p1 FROM Person p1, Person p2 WHERE p1.Email = p2.Email AND p1.Id > p2.Id;", difficulty: "Easy" as const },
  { title: "Second Highest Salary", details: "Write an SQL query to get the second highest salary from the Employee table.", hint: "Use DISTINCT and order by DESC with LIMIT 1 OFFSET 1, or use MAX(Salary) subquery.", answer: "SELECT MAX(Salary) AS SecondHighestSalary FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee);", difficulty: "Easy" as const },
  { title: "Combine Two Tables", details: "Combine Person and Address tables returning FirstName, LastName, City, and State.", hint: "Perform standard LEFT OUTER JOIN matching personId.", answer: "SELECT FirstName, LastName, City, State FROM Person LEFT JOIN Address ON Person.PersonId = Address.PersonId;", difficulty: "Easy" as const },
  { title: "Employees Earning More Than Managers", details: "Find employees earning strictly more than their direct managers.", hint: "Self join the Employee table matching managerId.", answer: "SELECT e.Name AS Employee FROM Employee e JOIN Employee m ON e.ManagerId = m.Id WHERE e.Salary > m.Salary;", difficulty: "Easy" as const },
  { title: "Customers Who Never Order", details: "Find all customers who never ordered anything.", hint: "Use LEFT JOIN and look for NULL Order IDs, or use NOT IN.", answer: "SELECT Name AS Customers FROM Customers LEFT JOIN Orders ON Customers.Id = Orders.CustomerId WHERE Orders.Id IS NULL;", difficulty: "Easy" as const },
  { title: "Big Countries", details: "Find the name, population, and area of big countries (area > 3M sq km or population > 25M).", hint: "Simple SELECT query with WHERE clause and OR condition.", answer: "SELECT name, population, area FROM World WHERE area > 3000000 OR population > 25000000;", difficulty: "Easy" as const },
  { title: "Classes More Than 5 Students", details: "Find all the classes which have at least 5 students.", hint: "Group by class and count distinct student.", answer: "SELECT class FROM courses GROUP BY class HAVING COUNT(DISTINCT student) >= 5;", difficulty: "Easy" as const },
  { title: "Customer Placing Largest Orders", details: "Find the customer_number in the orders table that has placed the largest number of orders.", hint: "Group by customer_number, count, order desc, limit 1.", answer: "SELECT customer_number FROM orders GROUP BY customer_number ORDER BY COUNT(*) DESC LIMIT 1;", difficulty: "Easy" as const },
  { title: "Swap Salary", details: "Swap all 'f' and 'm' values (i.e., change f to m and vice versa) in a single update statement with no intermediate temp table.", hint: "Use a CASE WHEN statement inside UPDATE.", answer: "UPDATE Salary SET sex = CASE sex WHEN 'm' THEN 'f' ELSE 'm' END;", difficulty: "Easy" as const },

  { title: "Rank Scores", details: "Rank scores in descending order. If there is a tie between two scores, both should have the same ranking.", hint: "Use DENSE_RANK() window function.", answer: "SELECT Score, DENSE_RANK() OVER (ORDER BY Score DESC) AS 'Rank' FROM Scores;", difficulty: "Medium" as const },
  { title: "Consecutive Available Seats", details: "Find all consecutive available seats in a cinema theater where free seat code is 1.", hint: "Self join the theater table on seat_id = seat_id + 1 or seat_id - 1.", answer: "SELECT DISTINCT a.seat_id FROM cinema a JOIN cinema b ON ABS(a.seat_id - b.seat_id) = 1 AND a.free = 1 AND b.free = 1 ORDER BY a.seat_id;", difficulty: "Medium" as const },
  { title: "Nth Highest Salary", details: "Write a function to return the Nth highest salary in SQL.", hint: "Use LIMIT 1 OFFSET N-1 inside functional parameter sets.", answer: "SELECT DISTINCT Salary FROM Employee ORDER BY Salary DESC LIMIT 1 OFFSET N;", difficulty: "Medium" as const },
  { title: "Department Highest Salary", details: "Find employees with the highest salary in each department.", hint: "Use subquery with (DepartmentId, Salary) IN MAX(Salary).", answer: "SELECT d.Name, e.Name, e.Salary FROM Employee e JOIN Department d ON e.DepartmentId = d.Id WHERE (e.DepartmentId, e.Salary) IN (SELECT DepartmentId, MAX(Salary) FROM Employee GROUP BY DepartmentId);", difficulty: "Medium" as const },
  { title: "Investments in 2016", details: "Calculate total insurance investment sums meeting precise geographic uniqueness criteria.", hint: "Use subqueries with GROUP BY and HAVING COUNT(*) comparisons.", answer: "SELECT SUM(TIV_2016) FROM Insurance WHERE TIV_2015 IN (SELECT TIV_2015 FROM Insurance GROUP BY TIV_2015 HAVING COUNT(*) > 1);", difficulty: "Medium" as const },
  { title: "Exchange Seats", details: "Write an SQL query to swap seat id of every two consecutive students.", hint: "Use CASE WHEN with modulo on ID, and COALESCE.", answer: "SELECT (CASE WHEN MOD(id, 2) != 0 AND id = (SELECT COUNT(*) FROM seat) THEN id WHEN MOD(id, 2) != 0 THEN id + 1 ELSE id - 1 END) AS id, student FROM seat ORDER BY id ASC;", difficulty: "Medium" as const },
  { title: "Tree Node Status", details: "Write a query to print the node id and the type of the node (Root, Inner, Leaf).", hint: "Use CASE with checking parent node id mapping.", answer: "SELECT id, CASE WHEN p_id IS NULL THEN 'Root' WHEN id IN (SELECT DISTINCT p_id FROM Tree WHERE p_id IS NOT NULL) THEN 'Inner' ELSE 'Leaf' END AS type FROM Tree;", difficulty: "Medium" as const },
  { title: "Capital Gain/Loss", details: "Write an SQL query to report the Capital gain/loss for each stock.", hint: "Sum up positive prices for sell, negative for buy.", answer: "SELECT stock_name, SUM(CASE WHEN operation = 'Buy' THEN -price ELSE price END) AS capital_gain_loss FROM Stocks GROUP BY stock_name;", difficulty: "Medium" as const },

  { title: "Top Earners in Departments", details: "Write an SQL query to find employees who have the highest salary in each of the departments.", hint: "Use a subquery with IN or a window function DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC).", answer: "SELECT Department.Name, Employee.Name, Employee.Salary FROM Employee JOIN Department ON Employee.DepartmentId = Department.Id WHERE (Employee.DepartmentId, Employee.Salary) IN (SELECT DepartmentId, MAX(Salary) FROM Employee GROUP BY DepartmentId);", difficulty: "Hard" as const },
  { title: "Department Top Three Salaries", details: "Find employees earning in the top three unique salaries for each department.", hint: "Use DENSE_RANK() partitioned by DepartmentId in a CTE.", answer: "WITH CTE AS (SELECT d.Name, e.Name, e.Salary, DENSE_RANK() OVER (PARTITION BY e.DepartmentId ORDER BY e.Salary DESC) AS R FROM Employee e JOIN Department d ON e.DepartmentId = d.Id) SELECT Name, Salary FROM CTE WHERE R <= 3;", difficulty: "Hard" as const },
  { title: "Trips and Users", details: "Calculate standard trip cancellation rates for unbanned users in target date partitions.", hint: "Select SUM(cancelled) / COUNT(*) grouped by request_at dates.", answer: "SELECT Request_at, ROUND(SUM(CASE WHEN Status != 'completed' THEN 1 ELSE 0 END)/COUNT(*), 2) FROM Trips WHERE Client_Id NOT IN (SELECT Users_Id FROM Users WHERE Banned = 'Yes') GROUP BY Request_at;", difficulty: "Hard" as const },
  { title: "Human Traffic of Stadium", details: "Write a query to display the records with three or more consecutive rows where stadium capacity >= 100.", hint: "Use window functions like LEAD and LAG or self-joins to find streaks.", answer: "SELECT DISTINCT t1.* FROM stadium t1, stadium t2, stadium t3 WHERE t1.people >= 100 AND t2.people >= 100 AND t3.people >= 100 AND ((t1.id - t2.id = 1 AND t1.id - t3.id = 2 AND t2.id - t3.id = 1) OR (t2.id - t1.id = 1 AND t2.id - t3.id = 2 AND t1.id - t3.id = 1) OR (t3.id - t2.id = 1 AND t3.id - t1.id = 2 AND t2.id - t1.id = 1)) ORDER BY t1.id;", difficulty: "Hard" as const },
  { title: "Sales Analyst Market Analysis II", details: "Find for each user, whether the brand of the second item they sold is their favorite brand.", hint: "Use ROW_NUMBER() window function partitioned by seller_id ordered by sale_date.", answer: "WITH ItemsSold AS (SELECT seller_id, item_id, ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY order_date) AS rn FROM Orders) SELECT u.user_id, CASE WHEN i.item_brand = u.favorite_brand THEN 'yes' ELSE 'no' END AS 2nd_item_fav_brand FROM Users u LEFT JOIN ItemsSold s ON u.user_id = s.seller_id AND s.rn = 2 LEFT JOIN Items i ON s.item_id = i.item_id;", difficulty: "Hard" as const }
];

const PUZZLE_POOL = [
  { title: "3 Bulbs & 3 Switches", details: "There are three light switches downstairs, each controlling one of three light bulbs upstairs. You can only visit the upstairs room once. How do you identify which switch controls which bulb?", hint: "Light bulbs emit heat when left switched on.", answer: "Turn on Switch 1 for 10 minutes, turn it off, turn on Switch 2, then go upstairs. The hot off bulb is Switch 1, the lit bulb is Switch 2, the cold off bulb is Switch 3.", difficulty: "Easy" as const },
  { title: "Fox, Goose, and Beans", details: "A farmer needs to cross a river with a fox, a goose, and a bag of beans. The boat can only hold the farmer and one item. Fox eats goose, goose eats beans if left unsupervised. How does he cross?", hint: "The goose must be taken across first, and then carried back to avoid conflicts later.", answer: "Goose over, farmer back. Fox over, goose back. Beans over, farmer back. Goose over. Done.", difficulty: "Easy" as const },
  { title: "3 Sons Ages Riddle", details: "The product of three sons' ages is 36. The sum of their ages is the house number across the street. The oldest has blue eyes. What are their ages?", hint: "Houses have numbers. The sum must have two possible factorizations (1, 6, 6 vs 2, 2, 9). Blue eyes implies a single oldest.", answer: "The sum sum is 13. The factors are 2, 2, and 9 (the oldest is 9).", difficulty: "Easy" as const },
  { title: "The Lily Pad Exponential Growth", details: "A water lily doubles in size every day. If it takes 48 days for the lily to cover the entire pond, how long does it take to cover exactly half of the pond?", hint: "If it doubles every day, then the day before it covered half.", answer: "47 days (since it doubles on the 48th day to cover the whole pond).", difficulty: "Easy" as const },
  { title: "The Three Mislabeled Boxes", details: "You have boxes labeled Apples, Oranges, and Mixed. All labels are wrong. You can pick one fruit from one box without looking inside. How do you label them all?", hint: "Start by picking a fruit from the Mixed box. Since all labels are wrong, that box is definitely what you pick.", answer: "Pick from Mixed. If Apple, that box is Apples. The one labeled Oranges must be Mixed, and the one labeled Apples is Oranges.", difficulty: "Easy" as const },

  { title: "Burning Ropes for 45 Minutes", details: "You have two ropes. Each takes exactly 60 minutes to burn completely, but they burn unevenly. How do you measure exactly 45 minutes using these two ropes and a lighter?", hint: "Light both ends of a rope to make it burn in exactly 30 minutes.", answer: "Light Rope 1 at both ends and Rope 2 at one end. When Rope 1 burns out (30 mins), light the other end of Rope 2. When Rope 2 burns out, exactly 45 minutes have elapsed.", difficulty: "Medium" as const },
  { title: "The 9 Balls Weight Challenge", details: "You have 9 identical-looking balls, but 1 is slightly heavier than the others. You have a balance scale. Find the heavier ball in only 2 weighings.", hint: "Divide the 9 balls into 3 groups of 3. Weigh group A against group B first.", answer: "Weigh 3 vs 3. If they balance, the heavy ball is in group C. If not, it's in the heavier side. From that group of 3, weigh 1 vs 1. If balance, the 3rd is heavier.", difficulty: "Medium" as const },
  { title: "The Poisoned Wine Paradox", details: "A king has 1000 bottles of wine, but 1 is poisoned. He has 10 prisoners. How can he identify the poisoned bottle in exactly 24 hours using them?", hint: "Use binary indexing coordinates. 1000 fits exactly inside 2^10 (1024) bits.", answer: "Number bottles in binary. Prisoner i drinks from all bottles where the i-th bit is 1. The dead code reveals the bin id.", difficulty: "Medium" as const },
  { title: "Two Hourglasses Riddle", details: "You have a 7-minute hourglass and an 11-minute hourglass. How can you measure exactly 15 minutes?", hint: "Start both together. Flip them when they run out.", answer: "Start both. When 7-min runs out (7m elapsed), start measuring. 11-min has 4 mins left. When 11-min runs out (4m measured), flip it. It runs for 11 mins more. Total 15m.", difficulty: "Medium" as const },
  { title: "The High Bridge Flashlight", details: "Two people cross a bridge in 1 and 2 minutes. Two slower people cross in 5 and 10 minutes. A flashlight is required. How can they cross in 17 minutes?", hint: "Send the two fastest first, then one returns. Send the two slowest next, then the other fast person returns.", answer: "1 & 2 cross (2), 1 returns (3), 5 & 10 cross (13), 2 returns (15), 1 & 2 cross (17). Total = 17 mins.", difficulty: "Medium" as const },

  { title: "Crossing the Bridge at Night", details: "Four people need to cross a rickety bridge at night. They have one flashlight. The bridge can only hold two people at once. Crossing times are 1, 2, 5, and 10 minutes. How can they all cross in 17 minutes?", hint: "Send the two fastest first, then bring the flashlight back, then send the two slowest together.", answer: "1 and 2 cross (2m), 1 returns (3m). 5 and 10 cross (13m), 2 returns (15m). 1 and 2 cross (17m). Total = 17 mins.", difficulty: "Hard" as const },
  { title: "The Monty Hall Paradox", details: "You are on a game show with 3 doors: behind one is a car, behind others are goats. You pick Door 1. The host opens Door 3 revealing a goat. Should you switch to Door 2?", hint: "Calculate the probability if you switch versus if you stay.", answer: "Switching gives a 2/3 probability of winning the car, while staying only gives 1/3.", difficulty: "Hard" as const },
  { title: "100 Prisoners & 100 Boxes", details: "100 prisoners must find their numbers inside 100 closed boxes. Success requires ALL prisoners to find their number. They can open 50 boxes.", hint: "Apply the loop strategy where each prisoner starts by opening the box carrying their own number.", answer: "Pris opens box P. If num == P: done. Else open box with that num. Success rate ~31.18%.", difficulty: "Hard" as const },
  { title: "Blue Eyes Island Paradox", details: "100 people with blue eyes live on an island. If anyone learns they have blue eyes, they must leave at 8 PM. A visitor says 'At least one of you has blue eyes'. What happens?", hint: "Use mathematical induction. If N=1, they leave day 1. If N=k, they leave on day k.", answer: "All 100 blue-eyed people leave on the 100th night at 8 PM.", difficulty: "Hard" as const },
  { title: "The Counterfeit Coins Weighing", details: "You have 12 identical-looking coins, one is counterfeit (either lighter or heavier). Using a balance scale 3 times, how do you find it and its relative weight?", hint: "Divide the 12 coins into three groups of four (1-4, 5-8, 9-12).", answer: "Weigh 4 vs 4. If they balance, it is in the other 4. If not, we track which side was heavier and systematically swap coins to isolate it.", difficulty: "Hard" as const }
];

interface AptitudeQuestion {
  id: string;
  category: "Quantitative" | "Logical" | "Verbal" | "Technical" | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const APTITUDE_POOL: AptitudeQuestion[] = [
  // Quantitative Aptitude
  {
    id: "apt-q-1",
    category: "Quantitative",
    difficulty: "Easy",
    question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    options: ["120 meters", "150 meters", "324 meters", "180 meters"],
    answer: "150 meters",
    explanation: "Speed in m/s = 60 * (5/18) = 50/3 m/s. Length of the train = Speed * Time = (50/3) * 9 = 150 meters."
  },
  {
    id: "apt-q-2",
    category: "Quantitative",
    difficulty: "Medium",
    question: "A sum of money at compound interest doubles itself in 15 years. It will become eight times of itself in how many years?",
    options: ["30 years", "40 years", "45 years", "60 years"],
    answer: "45 years",
    explanation: "Under compound interest, if a sum becomes 2 times in 15 years, it will become (2)^3 = 8 times in 3 * 15 = 45 years."
  },
  {
    id: "apt-q-3",
    category: "Quantitative",
    difficulty: "Hard",
    question: "The ratio of work efficiency of A, B, and C is 5:3:8. Working together, they can complete a task in 30 days. In how many days can A and B together complete 60% of the same task?",
    options: ["30 days", "36 days", "40 days", "48 days"],
    answer: "36 days",
    explanation: "Total efficiency = 5 + 3 + 8 = 16. Total work = 16 * 30 = 480. 60% of total work = 480 * 0.60 = 288. Combined efficiency of A and B = 5 + 3 = 8. Days required by A and B = 288 / 8 = 36 days."
  },
  {
    id: "apt-q-4",
    category: "Quantitative",
    difficulty: "Medium",
    question: "A can do a piece of work in 20 days, B in 30 days, and C in 60 days. In how many days can A do the work if he is assisted by B and C on every third day?",
    options: ["12 days", "15 days", "16 days", "18 days"],
    answer: "15 days",
    explanation: "A's 1 day work = 1/20. B's 1 day work = 1/30. C's 1 day work = 1/60. Work done in first 2 days by A alone = 2 * (1/20) = 1/10. Work done on 3rd day by A, B, and C together = 1/20 + 1/30 + 1/60 = 1/10. Total work done in 3 days = 1/10 + 1/10 = 1/5. Thus, the whole work is completed in 3 * 5 = 15 days."
  },
  
  // Logical Reasoning
  {
    id: "apt-l-1",
    category: "Logical",
    difficulty: "Easy",
    question: "Find the missing number in the sequence: 4, 9, 20, 43, 90, ___.",
    options: ["180", "183", "185", "189"],
    answer: "185",
    explanation: "The pattern is: (Previous Number * 2) + K, where K increments by 1 in each step. 4*2+1=9; 9*2+2=20; 20*2+3=43; 43*2+4=90; 90*2+5=185."
  },
  {
    id: "apt-l-2",
    category: "Logical",
    difficulty: "Medium",
    question: "Six friends A, B, C, D, E, and F are sitting in a circle facing the center. F is to the immediate left of A. B is opposite E. C is between A and B. Who is to the immediate right of F?",
    options: ["A", "B", "D", "E"],
    answer: "D",
    explanation: "Arranging them in a circle facing inside: F is to the left of A. C is between A and B. B is opposite E. This leaves D to sit between E and F. Facing the center, the person to the immediate right of F is D."
  },
  {
    id: "apt-l-3",
    category: "Logical",
    difficulty: "Hard",
    question: "Consider statements: 'All painters are artists.' 'Some artists are writers.' 'No writers are singers.' Which conclusions are valid? (I: Some artists are painters. II: Some singers are painters. III: No singer is a writer.)",
    options: ["Only conclusion I", "Only conclusions I and II", "Only conclusions I and III", "All conclusions follow"],
    answer: "Only conclusions I and III",
    explanation: "All painters are artists, so some artists are definitely painters (I is valid). No writer is a singer, so no singer is a writer (III is valid by direct contrapositive). No link exists between singers and painters, so II is invalid."
  },

  // Verbal Ability
  {
    id: "apt-v-1",
    category: "Verbal",
    difficulty: "Easy",
    question: "Choose the word opposite in meaning (Antonym) to 'BENEVOLENT':",
    options: ["Generous", "Malevolent", "Sympathetic", "Affable"],
    answer: "Malevolent",
    explanation: "Benevolent means kind-hearted, well-meaning, or generous. Its antonym is malevolent, which means wishing evil or harm to others."
  },
  {
    id: "apt-v-2",
    category: "Verbal",
    difficulty: "Medium",
    question: "Identify the grammatically incorrect section of the sentence: 'The team was (1) / having a dispute (2) / among themselves (3) / about the design (4).'",
    options: ["Section 1 ('was')", "Section 2 ('having a dispute')", "Section 3 ('among themselves')", "Section 4 ('about the design')"],
    answer: "Section 1 ('was')",
    explanation: "When a collective noun like 'team' refers to members acting individually or disagreeing ('among themselves'), it takes a plural verb. 'was' must be corrected to 'were'."
  },
  {
    id: "apt-v-3",
    category: "Verbal",
    difficulty: "Hard",
    question: "Rearrange the sentences (P, Q, R, S) into a coherent paragraph: (P) In the long run, this builds immense cognitive resilience. (Q) Reading regularly stimulates synaptic pathways in the brain. (R) It also broadens vocabulary and critical thinking. (S) Consequently, active readers score higher on analytical tasks.",
    options: ["Q - R - P - S", "Q - P - R - S", "R - Q - S - P", "P - S - Q - R"],
    answer: "Q - R - P - S",
    explanation: "Q introduces the primary topic (reading and brain stimulation). R adds a secondary immediate benefit ('It also...'). P explains the long-term cognitive consequence. S concludes with the ultimate result ('Consequently...')."
  },

  // Technical & Coding Tests
  {
    id: "apt-t-1",
    category: "Technical",
    difficulty: "Easy",
    question: "In a SQL database table 'Orders', which query correctly retrieves the total number of orders placed by customer_id '102'?",
    options: [
      "SELECT SUM(*) FROM Orders WHERE customer_id = 102;",
      "SELECT COUNT(*) FROM Orders WHERE customer_id = 102;",
      "SELECT COUNT(customer_id) FROM Orders GROUP BY customer_id = 102;",
      "SELECT COUNT(*) FROM Orders HAVING customer_id = 102;"
    ],
    answer: "SELECT COUNT(*) FROM Orders WHERE customer_id = 102;",
    explanation: "To retrieve the total count of rows satisfying a condition in a simple query, COUNT(*) with a WHERE clause is correct, standard, and highly efficient."
  },
  {
    id: "apt-t-2",
    category: "Technical",
    difficulty: "Medium",
    question: "Analyze this recursion snippet: `int fn(int n) { if (n <= 1) return 1; return n * fn(n - 2); }`. What is the value of `fn(5)`?",
    options: ["15", "24", "120", "150"],
    answer: "15",
    explanation: "Trace: fn(5) = 5 * fn(3). fn(3) = 3 * fn(1). Since 1 <= 1, fn(1) = 1. Therefore, fn(5) = 5 * 3 * 1 = 15."
  },
  {
    id: "apt-t-3",
    category: "Technical",
    difficulty: "Hard",
    question: "What is the worst-case time complexity of searching an element in a binary search tree (BST) that is completely unbalanced (skewed)?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    answer: "O(N)",
    explanation: "In a completely unbalanced (skewed) BST, the tree structure collapses into a linear linked list. Finding an element requires traversing all nodes, resulting in O(N) worst-case time complexity."
  },

  // Behavioral & Case Study Rounds
  {
    id: "apt-b-1",
    category: "Behavioral",
    difficulty: "Easy",
    question: "A colleague disagrees with your technical design proposal during a team review. Which response best exhibits high emotional intelligence and teamwork?",
    options: [
      "Defend your design aggressively and point out potential flaws in their past work.",
      "Acknowledge their feedback, ask them to explain their perspective, and work together to compare structural trade-offs.",
      "Ignore their objections and appeal directly to the manager to override their opinion.",
      "Politely tell them that your proposal has already been approved and cannot be changed."
    ],
    answer: "Acknowledge their feedback, ask them to explain their perspective, and work together to compare structural trade-offs.",
    explanation: "High EQ in engineering involves seeking understanding, fostering collaboration, and objectifying decisions by evaluating design trade-offs together."
  },
  {
    id: "apt-b-2",
    category: "Behavioral",
    difficulty: "Medium",
    question: "Using the STAR method to describe overcoming a project delay, which detail represents the 'Result' in a structured response?",
    options: [
      "Our backend database integration was delayed by 2 weeks due to third-party vendor downtime.",
      "I scheduled daily stand-ups and decoupled the frontend work so tasks could run in parallel.",
      "My primary objective was to refactor the payment gateway and minimize user checkout latency.",
      "We shipped the software 2 days ahead of the rescheduled deadline with 0 critical bugs, raising conversion rates by 8%."
    ],
    answer: "We shipped the software 2 days ahead of the rescheduled deadline with 0 critical bugs, raising conversion rates by 8%.",
    explanation: "In STAR, the 'Result' must quantify achievements, project outcomes, and business impact to demonstrate successful problem-solving and value delivery."
  },
  {
    id: "apt-b-3",
    category: "Behavioral",
    difficulty: "Hard",
    question: "A mobile app's onboarding registration screen has an A/B test running. Variation B has 2 fewer form fields and shows a 30% higher completion rate, but downstream user retention drops by 15%. What is the best product recommendation?",
    options: [
      "Adopt Variation B immediately because a 30% increase in signups always overrides later retention drops.",
      "Reject Variation B because retention is the only metric that matters for a long-term product lifecycle.",
      "Investigate Variation B's input deletions; key setup inputs may have been removed, leading to poor user onboarding alignment.",
      "Rerun the A/B test for another year to gather more volume and bypass statistical significance limits."
    ],
    answer: "Investigate Variation B's input deletions; key setup inputs may have been removed, leading to poor user onboarding alignment.",
    explanation: "A drop in retention despite higher signup volumes indicates the friction removed was crucial for user alignment, value setup, or accounts qualification."
  }
];

export default function SmartLadderPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ladderType, setLadderType] = useState<"Mixed" | "DSA/CP" | "SQL" | "Puzzles">("Mixed");
  const [ladderSize, setLadderSize] = useState<number>(15);
  const [ladderDifficulty, setLadderDifficulty] = useState<"Standard" | "Steep" | "Linear">("Standard");
  
  const [cfRatingTier, setCfRatingTier] = useState<"1100-1200" | "1300-1400" | "1500-1600" | "1700-1800">("1300-1400");
  const [targetDifficulty, setTargetDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");

  const [generating, setGenerating] = useState(false);
  const [activeLadder, setActiveLadder] = useState<LadderProblem[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [acceptedProblems, setAcceptedProblems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"ladder" | "daily" | "behavioral" | "aptitude">("daily");

  const handleTabChange = (tab: "ladder" | "daily" | "behavioral" | "aptitude") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("ic_active_ladder_tab", tab);
    }
  };
  
  // Collapsible and custom Toast notification states
  const [isSavedLaddersOpen, setIsSavedLaddersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Multiple saved ladders state
  const [savedLadders, setSavedLadders] = useState<Array<{ id: string; name: string; type: string; problems: LadderProblem[] }>>([]);
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);

  // =============================================
  // Smart Aptitude (AI) State Declarations
  // =============================================
  const [aptitudeSet, setAptitudeSet] = useState<AptitudeQuestion[]>([]);
  const [aptitudeAnswers, setAptitudeAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOption
  const [aptitudeRevealed, setAptitudeRevealed] = useState<Record<string, boolean>>({}); // questionId -> boolean
  const [expandedSolvedId, setExpandedSolvedId] = useState<string | null>(null);
  const [aptitudeDifficulties, setAptitudeDifficulties] = useState<Record<string, "Easy" | "Medium" | "Hard">>({
    "Quantitative": "Medium",
    "Logical": "Medium",
    "Verbal": "Medium",
    "Technical": "Medium",
    "Behavioral": "Medium"
  });

  // Exam Mode Simulator States
  const [examCompany, setExamCompany] = useState<"Infosys" | "TCS" | "IBM" | "FAANG" | null>(null);
  const [examQuestions, setExamQuestions] = useState<AptitudeQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [examActive, setExamActive] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examPaused, setExamPaused] = useState(false);

  // Aptitude Cumulative Stats (hydrated from/saved to profile.solvedPuzzleAnswers)
  const [aptStats, setAptStats] = useState({
    solvedCount: 0,
    correctCount: 0,
    quantMastery: 0,
    logicMastery: 0,
    verbalMastery: 0,
    technicalMastery: 0,
    behavioralMastery: 0,
    averageSpeedSec: 0,
    dailyHistory: {
      "Sun": { solved: 0, correct: 0 },
      "Mon": { solved: 0, correct: 0 },
      "Tue": { solved: 0, correct: 0 },
      "Wed": { solved: 0, correct: 0 },
      "Thu": { solved: 0, correct: 0 },
      "Fri": { solved: 0, correct: 0 },
      "Sat": { solved: 0, correct: 0 }
    } as Record<string, { solved: number; correct: number }>
  });

  const [questionStartTime, setQuestionStartTime] = useState<Record<string, number>>({});

  useEffect(() => {
    if (aptitudeSet.length > 0) {
      setQuestionStartTime(prev => {
        const next = { ...prev };
        aptitudeSet.forEach(q => {
          if (!next[q.id]) {
            next[q.id] = Date.now();
          }
        });
        return next;
      });
    }
  }, [aptitudeSet]);

  // STAR Framework Builder States
  const [starSituation, setStarSituation] = useState("");
  const [starTask, setStarTask] = useState("");
  const [starAction, setStarAction] = useState("");
  const [starResult, setStarResult] = useState("");
  const [starSaved, setStarSaved] = useState(false);
  const [activeStarPrompt, setActiveStarPrompt] = useState("Tell me about a time you solved a challenging technical bug.");
  const [savedStarStories, setSavedStarStories] = useState<Array<{ prompt: string; situation: string; task: string; action: string; result: string; date: string }>>([]);
  const [examHistory, setExamHistory] = useState<Array<{ company: string; score: string; time: string; status: string; xp: string }>>([]);

  useEffect(() => {
    const user = getLoggedInUser();

    // Restore persisted active tab selection — URL param takes priority over localStorage
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab");
      if (urlTab && ["ladder", "daily", "behavioral", "aptitude"].includes(urlTab)) {
        setActiveTab(urlTab as any);
        // Clear the URL param so it doesn't persist on manual tab changes
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        const persistedTab = localStorage.getItem("ic_active_ladder_tab");
        if (persistedTab && ["ladder", "daily", "behavioral", "aptitude"].includes(persistedTab)) {
          setActiveTab(persistedTab as any);
        }
      }
    }

    if (user) {
      const uProf = getUserProfile(user);
      setProfile(uProf);
      
      // Load active ladder
      if (uProf.solvedPuzzleAnswers?.["ai_ladder_data"]) {
        try {
          const savedLadder = JSON.parse(uProf.solvedPuzzleAnswers["ai_ladder_data"]);
          setActiveLadder(savedLadder);
        } catch (e) {
          console.error("Failed to parse saved ladder:", e);
        }
      }

      // Load all saved ladders
      let saved: any[] = [];
      if (uProf.solvedPuzzleAnswers?.["saved_ladders_data"]) {
        try {
          saved = JSON.parse(uProf.solvedPuzzleAnswers["saved_ladders_data"]);
        } catch (e) {
          console.error("Failed to parse saved ladders:", e);
        }
      }
      
      // Comprehensive Recovery Scan for lost/disappeared saved ladders:
      if (typeof window !== "undefined") {
        const allRecovered: any[] = [...saved];
        const seenIds = new Set(allRecovered.map(item => item.id));

        // 1. Scan fallback local storage key
        const fallback = localStorage.getItem("ic_saved_ladders_fallback");
        if (fallback) {
          try {
            const fallbackList = JSON.parse(fallback);
            if (Array.isArray(fallbackList)) {
              fallbackList.forEach(item => {
                if (item && item.id && !seenIds.has(item.id)) {
                  allRecovered.push(item);
                  seenIds.add(item.id);
                }
              });
            }
          } catch (e) {}
        }

        // 2. Scan ALL user profiles in ic_profiles (e.g. Guest, Akshay, or past users)
        const profilesRaw = localStorage.getItem("ic_profiles");
        if (profilesRaw) {
          try {
            const profiles = JSON.parse(profilesRaw);
            Object.keys(profiles).forEach(pName => {
              const prof = profiles[pName];
              const pSavedLaddersData = prof?.solvedPuzzleAnswers?.["saved_ladders_data"];
              if (pSavedLaddersData) {
                try {
                  const pList = JSON.parse(pSavedLaddersData);
                  if (Array.isArray(pList)) {
                    pList.forEach(item => {
                      if (item && item.id && !seenIds.has(item.id)) {
                        allRecovered.push(item);
                        seenIds.add(item.id);
                      }
                    });
                  }
                } catch (e) {}
              }
            });
          } catch (e) {}
        }

        // 3. Scan root local storage for other common storage keys containing ladder list structures
        for (let j = 0; j < localStorage.length; j++) {
          const key = localStorage.key(j);
          if (key && (key.includes("ladder") || key.includes("save")) && key !== "ic_profiles" && key !== "ic_saved_ladders_fallback") {
            try {
              const rawVal = localStorage.getItem(key);
              if (rawVal) {
                const parsedVal = JSON.parse(rawVal);
                if (Array.isArray(parsedVal)) {
                  parsedVal.forEach(item => {
                    if (item && item.id && item.problems && !seenIds.has(item.id)) {
                      allRecovered.push(item);
                      seenIds.add(item.id);
                    }
                  });
                }
              }
            } catch (e) {}
          }
        }

        // If we recovered any new ladders, update the current user's profile and save it!
        if (allRecovered.length > saved.length) {
          saved = allRecovered;
          if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
          uProf.solvedPuzzleAnswers["saved_ladders_data"] = JSON.stringify(allRecovered);
          saveUserProfile(uProf);
          localStorage.setItem("ic_saved_ladders_fallback", JSON.stringify(allRecovered));
        }
      }
      
      setSavedLadders(saved);

      // Hydrate saved STAR stories from localStorage
      if (typeof window !== "undefined") {
        const savedStoriesRaw = localStorage.getItem("ic_saved_star_stories") || "[]";
        try {
          setSavedStarStories(JSON.parse(savedStoriesRaw));
        } catch (e) {}

        const savedHistRaw = localStorage.getItem("ic_exam_history") || "[]";
        try {
          setExamHistory(JSON.parse(savedHistRaw));
        } catch (e) {}
      }

      // One-time Reset of Aptitude Progress as requested by the user
      if (uProf && (!uProf.solvedPuzzleAnswers || !uProf.solvedPuzzleAnswers["aptitude_progress_reset_v3"])) {
        console.log("Resetting Smart Aptitude (AI) progress to clean slate...");
        
        let correctAnswersGained = 0;
        if (uProf.solvedPuzzleAnswers && uProf.solvedPuzzleAnswers["aptitude_stats"]) {
          try {
            const parsed = JSON.parse(uProf.solvedPuzzleAnswers["aptitude_stats"]);
            correctAnswersGained = parsed.correctCount || 0;
          } catch (e) {}
        }
        
        // Deduct XP gained from correct aptitude answers
        const xpDeduction = correctAnswersGained * 15;
        uProf.xp = Math.max(0, uProf.xp - xpDeduction);
        
        // Filter out aptitude question IDs from solved list (IDs start with "apt-")
        uProf.solvedPuzzles = uProf.solvedPuzzles.filter(id => !id.startsWith("apt-"));
        
        // Remove individual aptitude question answers
        if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
        const answers = uProf.solvedPuzzleAnswers;
        if (answers) {
          Object.keys(answers).forEach(key => {
            if (key.startsWith("apt-") || key === "aptitude_stats" || key === "aptitude_daily_set" || key === "aptitude_difficulties" || key === "aptitude_recovery_v1" || key === "aptitude_recovery_v2") {
              delete answers[key];
            }
          });
          answers["aptitude_progress_reset_v3"] = "true";
        }
        
        // Save the profile to automatically sync to Supabase Cloud
        saveUserProfile(uProf);
        
        // Reset local state to empty
        setAptitudeAnswers({});
        setAptitudeRevealed({});
        setAptStats({
          solvedCount: 0,
          correctCount: 0,
          quantMastery: 0,
          logicMastery: 0,
          verbalMastery: 0,
          technicalMastery: 0,
          behavioralMastery: 0,
          averageSpeedSec: 0,
          dailyHistory: {
            Sun: { solved: 0, correct: 0 },
            Mon: { solved: 0, correct: 0 },
            Tue: { solved: 0, correct: 0 },
            Wed: { solved: 0, correct: 0 },
            Thu: { solved: 0, correct: 0 },
            Fri: { solved: 0, correct: 0 },
            Sat: { solved: 0, correct: 0 }
          }
        });
      }

      // Load aptitude stats and daily set
      if (uProf.solvedPuzzleAnswers?.["aptitude_stats"]) {
        try {
          const parsed = JSON.parse(uProf.solvedPuzzleAnswers["aptitude_stats"]);
          // Ensure dailyHistory exists (for profiles saved before this feature)
          if (!parsed.dailyHistory) {
            parsed.dailyHistory = {
              Sun: { solved: 0, correct: 0 },
              Mon: { solved: 0, correct: 0 },
              Tue: { solved: 0, correct: 0 },
              Wed: { solved: 0, correct: 0 },
              Thu: { solved: 0, correct: 0 },
              Fri: { solved: 0, correct: 0 },
              Sat: { solved: 0, correct: 0 },
            };
          }
          // Backfill today's data if solves occurred before dailyHistory tracking was added
          // (i.e. today shows 0 but there are recorded solvedCount > 0)
          const DAY_KEYS_INIT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const todayKeyInit = DAY_KEYS_INIT[new Date().getDay()];
          if (!parsed.dailyHistory[todayKeyInit]) {
            parsed.dailyHistory[todayKeyInit] = { solved: 0, correct: 0 };
          }
          const todayEntry = parsed.dailyHistory[todayKeyInit];
          if (todayEntry.solved === 0 && parsed.solvedCount > 0) {
            // Backfill: assume all existing solves happened today
            // (conservative: at minimum reflect what we know)
            todayEntry.solved = parsed.solvedCount;
            todayEntry.correct = parsed.correctCount;
            // Persist the backfill so it survives reloads
            uProf.solvedPuzzleAnswers!["aptitude_stats"] = JSON.stringify(parsed);
            saveUserProfile(uProf);
          }
          setAptStats(parsed);
        } catch (e) {}
      }
      if (uProf.solvedPuzzleAnswers?.["aptitude_difficulties"]) {
        try {
          setAptitudeDifficulties(JSON.parse(uProf.solvedPuzzleAnswers["aptitude_difficulties"]));
        } catch (e) {}
      }
      
      let dailySetLoaded = false;
      if (uProf.solvedPuzzleAnswers?.["aptitude_daily_set"]) {
        try {
          const parsedSet = JSON.parse(uProf.solvedPuzzleAnswers["aptitude_daily_set"]);
          if (Array.isArray(parsedSet) && parsedSet.length === 5) {
            setAptitudeSet(parsedSet);
            dailySetLoaded = true;

            // Hydrate answers and revealed states for pre-solved questions in daily set
            const answers: Record<string, string> = {};
            const revealed: Record<string, boolean> = {};
            parsedSet.forEach((q: any) => {
              if (uProf.solvedPuzzleAnswers![q.id]) {
                answers[q.id] = uProf.solvedPuzzleAnswers![q.id];
                revealed[q.id] = true;
              }
            });
            setAptitudeAnswers(answers);
            setAptitudeRevealed(revealed);
          }
        } catch (e) {}
      }
      
      if (!dailySetLoaded) {
        // Generate daily set from current difficulties
        const freshSet: AptitudeQuestion[] = [];
        let diffs = { "Quantitative": "Medium" as const, "Logical": "Medium" as const, "Verbal": "Medium" as const, "Technical": "Medium" as const, "Behavioral": "Medium" as const };
        if (uProf.solvedPuzzleAnswers?.["aptitude_difficulties"]) {
          try {
            diffs = JSON.parse(uProf.solvedPuzzleAnswers["aptitude_difficulties"]);
          } catch (e) {}
        }
          
        (["Quantitative", "Logical", "Verbal", "Technical", "Behavioral"] as const).forEach(cat => {
          const targetDiff = diffs[cat] || "Medium";
          let selected: AptitudeQuestion;
          if (cat === "Quantitative") {
            selected = APTITUDE_POOL.find(q => q.id === "apt-q-4") || APTITUDE_POOL[0];
          } else {
            const pool = APTITUDE_POOL.filter(q => q.category === cat && q.difficulty === targetDiff);
            selected = pool[Math.floor(Math.random() * pool.length)] || APTITUDE_POOL.find(q => q.category === cat) || APTITUDE_POOL[0];
          }
          freshSet.push(selected);
        });
        
        setAptitudeSet(freshSet);
        if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
        uProf.solvedPuzzleAnswers["aptitude_daily_set"] = JSON.stringify(freshSet);

        // Hydrate answers and revealed states for pre-solved questions in fresh set
        const answers: Record<string, string> = {};
        const revealed: Record<string, boolean> = {};
        freshSet.forEach(q => {
          if (uProf.solvedPuzzleAnswers![q.id]) {
            answers[q.id] = uProf.solvedPuzzleAnswers![q.id];
            revealed[q.id] = true;
          }
        });
        setAptitudeAnswers(answers);
        setAptitudeRevealed(revealed);

        saveUserProfile(uProf);
      }
    }
  }, []);

  const triggerGenerateLadder = () => {
    setGenerating(true);
    setActiveLadder([]);
    
    setTimeout(() => {
      const generated: LadderProblem[] = [];
      const difficulties: Array<"Easy" | "Medium" | "Hard"> = [];
      
      for (let i = 0; i < ladderSize; i++) {
        if (targetDifficulty !== "Mixed") {
          difficulties.push(targetDifficulty);
        } else {
          if (ladderDifficulty === "Standard") {
            if (i < ladderSize * 0.35) difficulties.push("Easy");
            else if (i < ladderSize * 0.75) difficulties.push("Medium");
            else difficulties.push("Hard");
          } else if (ladderDifficulty === "Steep") {
            if (i < ladderSize * 0.2) difficulties.push("Easy");
            else if (i < ladderSize * 0.5) difficulties.push("Medium");
            else difficulties.push("Hard");
          } else {
            if (i % 3 === 0) difficulties.push("Easy");
            else if (i % 3 === 1) difficulties.push("Medium");
            else difficulties.push("Hard");
          }
        }
      }

      const usedTitles = new Set<string>();

      for (let i = 0; i < ladderSize; i++) {
        const diff = difficulties[i];
        const stepNum = i + 1;
        
        let platform: "Codeforces" | "LeetCode" | "SQL" | "Puzzle" = "Codeforces";
        if (ladderType === "SQL") platform = "SQL";
        else if (ladderType === "Puzzles") platform = "Puzzle";
        else if (ladderType === "DSA/CP") platform = "Codeforces";
        else {
          const types: Array<"Codeforces" | "LeetCode" | "SQL" | "Puzzle"> = ["Codeforces", "LeetCode", "SQL", "Puzzle"];
          platform = types[i % types.length];
        }

        let title = "";
        let details = "";
        let hint = "";
        let answer = "";
        let problemUrl = "";

        if (platform === "Codeforces" || platform === "LeetCode") {
          const pool = diff === "Easy" ? CF_DSA_EASY_PROBLEMS : diff === "Medium" ? CF_DSA_MEDIUM_PROBLEMS : CF_DSA_HARD_PROBLEMS;
          
          // Select unique
          let selected = pool[0];
          let found = false;
          for (let k = 0; k < pool.length; k++) {
            const temp = pool[(i + k) % pool.length];
            if (!usedTitles.has(temp.title)) {
              selected = temp;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let k = 0; k < pool.length; k++) {
              if (!usedTitles.has(pool[k].title)) {
                selected = pool[k];
                found = true;
                break;
              }
            }
          }
          let finalTitle = selected.title;
          if (!found) {
            let variant = 2;
            while (usedTitles.has(`${selected.title} (Var ${variant})`)) {
              variant++;
            }
            finalTitle = `${selected.title} (Var ${variant})`;
          }
          usedTitles.add(finalTitle);
          
          // Dynamically detect correct platform based on URL
          const actualPlatform = selected.url.includes("leetcode.com") ? "LeetCode" : "Codeforces";
          platform = actualPlatform;
          
          let rating = 1300;
          if (cfRatingTier === "1100-1200") {
            rating = 1100 + Math.floor((i / ladderSize) * 100);
          } else if (cfRatingTier === "1300-1400") {
            rating = 1300 + Math.floor((i / ladderSize) * 100);
          } else if (cfRatingTier === "1500-1600") {
            rating = 1500 + Math.floor((i / ladderSize) * 100);
          } else {
            rating = 1700 + Math.floor((i / ladderSize) * 100);
          }
          rating = Math.round(rating / 100) * 100;

          title = platform === "Codeforces" ? `CP ${rating}: ${finalTitle}` : `DSA: ${finalTitle}`;
          details = selected.details;
          hint = selected.hint;
          answer = selected.answer;
          problemUrl = selected.url;
        } else if (platform === "SQL") {
          const filtered = SQL_POOL.filter(p => p.difficulty === diff);
          const pool = filtered.length > 0 ? filtered : SQL_POOL;
          
          let selected = pool[0];
          let found = false;
          for (let k = 0; k < pool.length; k++) {
            const temp = pool[(i + k) % pool.length];
            if (!usedTitles.has(temp.title)) {
              selected = temp;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let k = 0; k < pool.length; k++) {
              if (!usedTitles.has(pool[k].title)) {
                selected = pool[k];
                found = true;
                break;
              }
            }
          }
          let finalTitle = selected.title;
          if (!found) {
            let variant = 2;
            while (usedTitles.has(`${selected.title} (Var ${variant})`)) {
              variant++;
            }
            finalTitle = `${selected.title} (Var ${variant})`;
          }
          usedTitles.add(finalTitle);

          title = `AI SQL: ${finalTitle}`;
          details = selected.details;
          hint = selected.hint;
          answer = selected.answer;
          problemUrl = ""; // No actual external practice link for custom SQL Playground
        } else {
          const filtered = PUZZLE_POOL.filter(p => p.difficulty === diff);
          const pool = filtered.length > 0 ? filtered : PUZZLE_POOL;
          
          let selected = pool[0];
          let found = false;
          for (let k = 0; k < pool.length; k++) {
            const temp = pool[(i + k) % pool.length];
            if (!usedTitles.has(temp.title)) {
              selected = temp;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let k = 0; k < pool.length; k++) {
              if (!usedTitles.has(pool[k].title)) {
                selected = pool[k];
                found = true;
                break;
              }
            }
          }
          let finalTitle = selected.title;
          if (!found) {
            let variant = 2;
            while (usedTitles.has(`${selected.title} (Var ${variant})`)) {
              variant++;
            }
            finalTitle = `${selected.title} (Var ${variant})`;
          }
          usedTitles.add(finalTitle);

          title = `Quant Puzzle: ${finalTitle}`;
          details = selected.details;
          hint = selected.hint;
          answer = selected.answer;
          problemUrl = ""; // No actual external practice link for custom local puzzles
        }

        generated.push({
          id: `ai-lad-${ladderType.toLowerCase().replace("/", "-")}-${diff.toLowerCase()}-${stepNum}`,
          title: title,
          platform,
          difficulty: diff,
          details,
          hint,
          answer,
          problemUrl: problemUrl || undefined
        });
      }

      setActiveLadder(generated);
      setGenerating(false);

      const user = getLoggedInUser();
      if (user) {
        const uProf = getUserProfile(user);
        if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
        uProf.solvedPuzzleAnswers["ai_ladder_data"] = JSON.stringify(generated);
        saveUserProfile(uProf);
      }
    }, 1500);
  };

  const handleSaveAndSyncLadder = () => {
    if (!profile || activeLadder.length === 0) return;
    
    const newSavedLadder = {
      id: `lad-${Date.now()}`,
      name: `${ladderType} Track - ${ladderSize} Items (${cfRatingTier}) - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      type: ladderType,
      problems: activeLadder
    };

    const updatedList = [...savedLadders, newSavedLadder];
    setSavedLadders(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("ic_saved_ladders_fallback", JSON.stringify(updatedList));
    }

    const uProf = { ...profile };
    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers["saved_ladders_data"] = JSON.stringify(updatedList);
    uProf.solvedPuzzleAnswers["ai_ladder_data"] = JSON.stringify(activeLadder);
    saveUserProfile(uProf);
    setProfile(uProf);
    showToast("Smart Prep ladder saved & synced across devices!");
  };

  const handleLoadSavedLadder = (ladder: typeof savedLadders[0]) => {
    if (!profile) return;
    setActiveLadder(ladder.problems);
    const uProf = { ...profile };
    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers["ai_ladder_data"] = JSON.stringify(ladder.problems);
    saveUserProfile(uProf);
    setProfile(uProf);
    showToast(`Loaded "${ladder.name.split(" - ")[0]} Track" successfully!`);
  };

  const handleDeleteSavedLadder = (ladderId: string) => {
    if (!profile) return;
    const updatedList = savedLadders.filter(l => l.id !== ladderId);
    setSavedLadders(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("ic_saved_ladders_fallback", JSON.stringify(updatedList));
    }

    const uProf = { ...profile };
    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers["saved_ladders_data"] = JSON.stringify(updatedList);
    saveUserProfile(uProf);
    setProfile(uProf);
  };

  const handleAcceptProblem = (prob: LadderProblem) => {
    if (acceptedProblems[prob.id]) return;
    
    if (prob.platform === "SQL") {
      const sqlProb: SqlProblem = {
        id: prob.id,
        title: prob.title,
        difficulty: prob.difficulty,
        description: prob.details,
        tables: [
          {
            name: "Employee",
            schema: "Employee(id INT, salary INT, departmentId INT)",
            columns: [
              { name: "id", type: "INT" },
              { name: "salary", type: "INT" },
              { name: "departmentId", type: "INT" }
            ]
          }
        ],
        seedSql: `
          CREATE TABLE Employee (id INT, salary INT, departmentId INT);
          INSERT INTO Employee (id, salary, departmentId) VALUES (1, 60000, 10);
          INSERT INTO Employee (id, salary, departmentId) VALUES (2, 85000, 20);
          INSERT INTO Employee (id, salary, departmentId) VALUES (3, 72000, 10);
          INSERT INTO Employee (id, salary, departmentId) VALUES (4, 98000, 20);
        `,
        expectedSql: prob.answer.includes("SELECT") ? prob.answer : "SELECT departmentId, AVG(salary) FROM Employee GROUP BY departmentId;",
        initialQuery: "-- AI Generated SQL Template\nSELECT ",
        hint: prob.hint
      };

      const saved = localStorage.getItem("ic_custom_sql_problems") || "[]";
      const list = JSON.parse(saved);
      if (!list.some((p: any) => p.id === prob.id)) {
        list.push(sqlProb);
        localStorage.setItem("ic_custom_sql_problems", JSON.stringify(list));
      }
      showToast("Synced to SQL Playground!");
    } else if (prob.platform === "Puzzle") {
      const puz: PuzzleType = {
        id: prob.id,
        title: prob.title,
        difficulty: prob.difficulty,
        category: "Probability",
        description: prob.details,
        hints: [prob.hint],
        correctAnswers: [prob.answer, "42.85%", "3/7", "0.428"],
        explanation: `Detailed solution outline: ${prob.answer}`,
        placeholder: "Select your answer...",
        options: [prob.answer, "2/5", "1/2", "3/8"]
      };

      const saved = localStorage.getItem("ic_custom_puzzles") || "[]";
      const list = JSON.parse(saved);
      if (!list.some((p: any) => p.id === prob.id)) {
        list.push(puz);
        localStorage.setItem("ic_custom_puzzles", JSON.stringify(list));
      }
      showToast("Synced to Logical Puzzles!");
    } else {
      // Codeforces / LeetCode (Time Practice)
      const hasCorrectLink = typeof prob.problemUrl === "string" && 
        prob.problemUrl.trim().length > 0 && 
        prob.problemUrl.startsWith("http") && 
        (prob.problemUrl.includes("/problems/") || prob.problemUrl.includes("/problemset/problem/"));

      if (hasCorrectLink) {
        const practiceProb: PracticeProblem = {
          id: prob.id,
          title: prob.title,
          platform: prob.platform === "Codeforces" ? "Codeforces" : "LeetCode",
          category: prob.platform === "Codeforces" ? "CP" : "DSA",
          difficulty: prob.difficulty,
          problemUrl: prob.problemUrl as string
        };

        const saved = localStorage.getItem("ic_custom_problems") || "[]";
        const list = JSON.parse(saved);
        if (!list.some((p: any) => p.id === prob.id)) {
          list.push(practiceProb);
          localStorage.setItem("ic_custom_problems", JSON.stringify(list));
        }

        // Set as active timed practice focus problem and redirect right away (do not start the stopwatch automatically)
        localStorage.setItem("ic_active_timer", JSON.stringify({
          title: prob.title.replace(/^Step \d+: /, ""),
          link: prob.problemUrl as string,
          plat: prob.platform === "Codeforces" ? "Codeforces" : "LeetCode",
          diff: prob.difficulty,
          startTime: null,
          accumulatedTime: 0,
          running: false
        }));

        showToast("Synced to Timed Practice!");
        router.push("/timer");
      } else {
        showToast("Cannot sync: CP/DSA problem requires a correct, active external link.");
        return; // Don't mark as accepted if we couldn't sync it
      }
    }

    setAcceptedProblems(prev => ({ ...prev, [prob.id]: true }));
    window.dispatchEvent(new Event("profile_updated"));
  };

  // =============================================
  // Smart Aptitude (AI) Helper & Event Handlers
  // =============================================

  // Exam countdown clock useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (examActive && !examPaused && examTimeRemaining > 0) {
      interval = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval!);
            finishExam(examAnswers, examQuestions);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [examActive, examTimeRemaining, examAnswers, examQuestions, examPaused]);

  // Aptitude daily challenge answering logic with Adaptive Difficulty
  const handleAptitudeAnswerSelect = (q: AptitudeQuestion, selectedOption: string) => {
    if (aptitudeAnswers[q.id] || !profile) return;

    const isCorrect = selectedOption === q.answer;
    const updatedAnswers = { ...aptitudeAnswers, [q.id]: selectedOption };
    setAptitudeAnswers(updatedAnswers);

    // Auto-reveal explanation
    setAptitudeRevealed(prev => ({ ...prev, [q.id]: true }));

    // Calculate dynamic adaptive difficulty update for this category
    const nextDiffMap: Record<"Easy" | "Medium" | "Hard", "Easy" | "Medium" | "Hard"> = {
      "Easy": "Medium",
      "Medium": isCorrect ? "Hard" : "Easy",
      "Hard": isCorrect ? "Hard" : "Medium"
    };
    const currentDiff = aptitudeDifficulties[q.category] || "Medium";
    const nextDiff = nextDiffMap[currentDiff];

    const updatedDifficulties = {
      ...aptitudeDifficulties,
      [q.category]: nextDiff
    };
    setAptitudeDifficulties(updatedDifficulties);

    // Reward XP + Update Stats
    const xpReward = isCorrect ? 15 : 0;
    const uProf = { ...profile };
    uProf.xp += xpReward;

    // Track the question as solved so they cannot answer it again to farm XP
    if (!uProf.solvedPuzzles.includes(q.id)) {
      uProf.solvedPuzzles.push(q.id);
    }

    const startTime = questionStartTime[q.id] || Date.now();
    const timeSpent = Math.max(2, Math.round((Date.now() - startTime) / 1000)); // cap at min 2 seconds for realism

    const currentStats = { ...aptStats };
    const oldSolvedCount = currentStats.solvedCount;
    currentStats.solvedCount += 1;
    if (isCorrect) currentStats.correctCount += 1;

    // Calculate new average speed
    const totalTimeBefore = oldSolvedCount * currentStats.averageSpeedSec;
    currentStats.averageSpeedSec = Math.round((totalTimeBefore + timeSpent) / currentStats.solvedCount);

    // Adjust mastery score percentage
    const masteryKeyMap = {
      "Quantitative": "quantMastery",
      "Logical": "logicMastery",
      "Verbal": "verbalMastery",
      "Technical": "technicalMastery",
      "Behavioral": "behavioralMastery"
    } as const;
    const key = masteryKeyMap[q.category];
    if (isCorrect) {
      currentStats[key] = Math.min(100, currentStats[key] + 8);
    } else {
      currentStats[key] = Math.max(0, currentStats[key] - 4);
    }

    // Update daily history for solved and correct counts
    // Use getDay() array indexing — reliable across all browser locales
    const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayKey = DAY_KEYS[new Date().getDay()];
    if (!currentStats.dailyHistory) {
      currentStats.dailyHistory = {
        Sun: { solved: 0, correct: 0 },
        Mon: { solved: 0, correct: 0 },
        Tue: { solved: 0, correct: 0 },
        Wed: { solved: 0, correct: 0 },
        Thu: { solved: 0, correct: 0 },
        Fri: { solved: 0, correct: 0 },
        Sat: { solved: 0, correct: 0 },
      };
    }
    // Ensure the specific day entry always exists before incrementing
    if (!currentStats.dailyHistory[todayKey]) {
      currentStats.dailyHistory[todayKey] = { solved: 0, correct: 0 };
    }
    currentStats.dailyHistory[todayKey].solved += 1;
    if (isCorrect) {
      currentStats.dailyHistory[todayKey].correct += 1;
    }
    setAptStats(currentStats);

    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers[q.id] = selectedOption;
    uProf.solvedPuzzleAnswers["aptitude_stats"] = JSON.stringify(currentStats);
    uProf.solvedPuzzleAnswers["aptitude_difficulties"] = JSON.stringify(updatedDifficulties);
    saveUserProfile(uProf);
    setProfile(uProf);

    if (isCorrect) {
      showToast(`Correct! +15 XP Awarded! ${q.category} difficulty set to ${nextDiff}.`);
    } else {
      showToast(`Incorrect! Explanation unlocked. ${q.category} difficulty set to ${nextDiff}.`);
    }
  };

  // Dynamically load next unsolved question for a category
  const handleLoadNextAptitudeQuestion = (q: AptitudeQuestion) => {
    if (!profile) return;

    const currentDiff = aptitudeDifficulties[q.category] || "Medium";

    // Filter the pool of this category and difficulty for questions that have NOT been solved/attempted by the user yet
    let pool = APTITUDE_POOL.filter(
      item => item.category === q.category &&
      item.difficulty === currentDiff &&
      !profile.solvedPuzzles.includes(item.id) &&
      !(profile.solvedPuzzleAnswers && profile.solvedPuzzleAnswers[item.id])
    );

    // If pool is empty, relax the difficulty filter
    if (pool.length === 0) {
      pool = APTITUDE_POOL.filter(
        item => item.category === q.category &&
        !profile.solvedPuzzles.includes(item.id) &&
        !(profile.solvedPuzzleAnswers && profile.solvedPuzzleAnswers[item.id])
      );
    }

    // If still empty (user has solved absolutely all questions in this category), fallback to any question that is not the current one
    if (pool.length === 0) {
      pool = APTITUDE_POOL.filter(item => item.category === q.category && item.id !== q.id);
    }

    const nextQ = pool[Math.floor(Math.random() * pool.length)] || q;

    // Replace in aptitudeSet
    const updatedSet = aptitudeSet.map(item => item.id === q.id ? nextQ : item);
    setAptitudeSet(updatedSet);

    // Clear answers and revealed states for this slot
    setAptitudeAnswers(prev => {
      const next = { ...prev };
      delete next[q.id];
      delete next[nextQ.id];
      return next;
    });

    setAptitudeRevealed(prev => {
      const next = { ...prev };
      delete next[q.id];
      delete next[nextQ.id];
      return next;
    });

    // Save updated daily set to user profile
    const uProf = { ...profile };
    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers["aptitude_daily_set"] = JSON.stringify(updatedSet);
    saveUserProfile(uProf);
    setProfile(uProf);

    showToast(`Loaded a new ${q.category} question!`);
  };

  // Exam simulator trigger
  const startExamCompany = (company: "Infosys" | "TCS" | "IBM" | "FAANG") => {
    const qCountMap = { Infosys: 10, TCS: 12, IBM: 8, FAANG: 12 };
    const timeMap = { Infosys: 1800, TCS: 2100, IBM: 1200, FAANG: 2400 }; // seconds

    const count = qCountMap[company];
    const seconds = timeMap[company];

    // Pick questions representing a realistic company mix from APTITUDE_POOL that are not in daily set
    const dailySetIds = new Set(aptitudeSet.map(q => q.id));
    let pool = APTITUDE_POOL.filter(q => !dailySetIds.has(q.id));
    
    // shuffle
    pool = [...pool].sort(() => 0.5 - Math.random());
    
    const questions: AptitudeQuestion[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(pool[i % pool.length]);
    }

    setExamCompany(company);
    setExamQuestions(questions);
    setExamAnswers({});
    setExamTimeRemaining(seconds);
    setExamActive(true);
    setExamFinished(false);
    setExamPaused(false);
    setExamScore(0);
    showToast(`AI Exam Mode Activated: ${company} mock test initiated!`);
  };

  // Exam completion scoring and reward processing
  const finishExam = (answers: Record<string, string>, questions: AptitudeQuestion[]) => {
    if (!profile) return;
    
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        correct++;
      }
    });

    const scorePct = questions.length > 0 ? (correct / questions.length) : 0;
    let xpReward = 15; // default base participation XP
    if (scorePct === 1) xpReward = 100; // Perfect score bonus
    else if (scorePct >= 0.7) xpReward = 75;
    else if (scorePct >= 0.5) xpReward = 50;

    const uProf = { ...profile };
    uProf.xp += xpReward;

    const currentStats = { ...aptStats };
    currentStats.solvedCount += questions.length;
    currentStats.correctCount += correct;

    // Sync cumulative accuracy averages to mastery scores across all 5 domains
    currentStats.quantMastery = Math.min(100, Math.round(currentStats.quantMastery + (scorePct * 10)));
    currentStats.logicMastery = Math.min(100, Math.round(currentStats.logicMastery + (scorePct * 10)));
    currentStats.verbalMastery = Math.min(100, Math.round(currentStats.verbalMastery + (scorePct * 10)));
    currentStats.technicalMastery = Math.min(100, Math.round(currentStats.technicalMastery + (scorePct * 10)));
    currentStats.behavioralMastery = Math.min(100, Math.round(currentStats.behavioralMastery + (scorePct * 10)));

    setAptStats(currentStats);
    setExamScore(correct);
    setExamActive(false);
    setExamFinished(true);

    // Save actual completed exam record in simulation history list
    const timeMap = { Infosys: 1800, TCS: 2100, IBM: 1200, FAANG: 2400 };
    const totalSecs = examCompany ? timeMap[examCompany] : 600;
    const elapsedSecs = totalSecs - examTimeRemaining;
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const elapsedRemainingSecs = elapsedSecs % 60;
    
    const newRecord = {
      company: `${examCompany} Mock Prep`,
      score: `${correct}/${questions.length} Correct (${Math.round(scorePct * 100)}%)`,
      time: `${elapsedMins}m ${elapsedRemainingSecs}s`,
      status: correct >= (questions.length * 0.7) ? "Passed" : "Practice More",
      xp: `+${xpReward} XP`
    };

    const updatedHist = [newRecord, ...examHistory];
    setExamHistory(updatedHist);
    if (typeof window !== "undefined") {
      localStorage.setItem("ic_exam_history", JSON.stringify(updatedHist));
    }

    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers["aptitude_stats"] = JSON.stringify(currentStats);
    saveUserProfile(uProf);
    setProfile(uProf);

    showToast(`Exam Finished! Score: ${correct}/${questions.length}. +${xpReward} XP awarded!`);
  };

  // One-click Timed Practice Sync
  const handleAddAptitudeToTimedPractice = (q: AptitudeQuestion) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("ic_active_timer", JSON.stringify({
      title: `${q.category} Aptitude: ${q.question.substring(0, 35)}...`,
      link: "", // no external link needed for local aptitude questions
      plat: "Puzzles",
      diff: q.difficulty,
      startTime: null,
      accumulatedTime: 0,
      running: false
    }));

    showToast("Synced to Timed Practice! Redirecting...");
    router.push("/timer");
  };

  // One-click Daily Routine Sync
  const handleAddAptitudeToDailyRoutine = (q: AptitudeQuestion) => {
    if (!profile) return;
    const uProf = { ...profile };
    
    // Add to puzzle checklist solves locally
    if (!uProf.solvedPuzzles.includes(q.id)) {
      uProf.solvedPuzzles.push(q.id);
    }
    
    const todayStr = getLocalTodayStr();
    if (!uProf.solvedPuzzleAnswers) uProf.solvedPuzzleAnswers = {};
    uProf.solvedPuzzleAnswers[q.id + "_date"] = todayStr;
    uProf.solvedPuzzleAnswers[q.id] = q.answer; // auto-solve correct check

    saveUserProfile(uProf);
    setProfile(uProf);
    showToast("Synced! Incremented Daily Analytical checklist items!");
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "SQL": return <Terminal className="h-4 w-4 text-violet-400" />;
      case "Puzzle": return <Puzzle className="h-4 w-4 text-emerald-400" />;
      default: return <Code className="h-4 w-4 text-sky-400" />;
    }
  };

  const guesstimatePool = [
    {
      type: "Guesstimate",
      title: "Estimate the daily power consumption of all data centers in India.",
      question: "Walk through your step-by-step logic, structuring framework, assumptions, and key numerical conversions to estimate this guesstimate challenge.",
      rubric: "Framework solution: 1) Estimate population or digital active base (~800M). 2) Base cloud load per active user (e.g. 0.05 kWh/day). 3) Account for localized servers vs enterprise setups (~150 large scale hubs). 4) Assume 10-15 MW average power per active hub. 5) Convert to TWh annual load."
    },
    {
      type: "Guesstimate",
      title: "Estimate the number of smartphone screens replaced in Mumbai annually.",
      question: "Outline a demand-side estimation model, Mumbai demographics, breakage frequencies, and market sizing parameters.",
      rubric: "Framework solution: 1) Mumbai population (~20M). 2) Smartphone penetration (~80% = 16M users). 3) Average screen breakage rate (e.g., 10% per year = 1.6M breakages). 4) Market segment share of official vs third-party repair hubs. 5) Aggregate to determine repair volumes."
    },
    {
      type: "Guesstimate",
      title: "Estimate the total number of cups of coffee consumed in Seattle per day.",
      question: "Determine population segments, daily drinking habits, office versus residential consumption, and café retail volumes.",
      rubric: "Framework solution: 1) Seattle population (~750k). 2) Active coffee drinkers (~70% = 525k). 3) Average consumption rate (2.2 cups/day). 4) Sum up office supply loads and café sales to compute ~1.15 million daily cups."
    }
  ];

  const caseStudyPool = [
    {
      type: "Case Study",
      title: "Reduce global database synchronization latency by 35%.",
      question: "Recommend a design topology, database configurations, scaling strategies, and architectural trade-offs.",
      rubric: "Key recommendations: 1) Deploy localized edge write-through caching layers. 2) Transition to active-active multi-region primary replication databases (such as CockroachDB or AWS Aurora global clusters). 3) Optimize index partitions and payload sizes using protocol buffers. 4) Balance consistency vs availability trade-offs (CAP theorem)."
    },
    {
      type: "Case Study",
      title: "Fintech App: Instant checkout conversion drops by 25%.",
      question: "How would you identify the root cause? Propose a structured diagnostic funnel and corrective architectural or design solutions.",
      rubric: "Diagnostic funnel: 1) Segment checkout failures by device, location, payment gateway, and network latency. 2) Analyze payment API error codes (e.g. 3DS authentication failures). 3) Audit UI transition checkpoints to find UX drop-offs. 4) Implement instant retry failovers across payment aggregators."
    },
    {
      type: "Case Study",
      title: "Design a scalable system to process and ingest 1 million telemetry log streams per second.",
      question: "Detail the message queue design, buffering strategies, schema configurations, and distributed storage engine choices.",
      rubric: "System architecture: 1) Distributed ingress buffer using Apache Kafka or AWS Kinesis. 2) Stream processing workers batching logs in memory (5-second windows). 3) Columnar storage destination (ClickHouse or AWS Redshift) for optimal analytical indexes. 4) Auto-scaling worker nodes dynamically."
    }
  ];

  // Daily seed selection based on current date index to ensure they refresh daily
  const todayDateIndex = typeof window !== "undefined" ? new Date().getDate() : 1;
  const dailyGuesstimate = guesstimatePool[todayDateIndex % guesstimatePool.length];
  const dailyCaseStudy = caseStudyPool[todayDateIndex % caseStudyPool.length];

  const casePrepQuestions = [
    {
      id: 1,
      ...dailyGuesstimate
    },
    {
      id: 2,
      ...dailyCaseStudy
    }
  ];

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main view container */}
      <main className="flex-1 lg:pl-72 pl-0 min-h-screen flex flex-col bg-zinc-950 pb-12">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between lg:px-8 px-4 pl-16 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Smart Ladder AI Console
            </h1>
          </div>
          <span className="text-xs text-zinc-500 font-semibold bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-500 fill-current" />
            <span>AI Coach Active</span>
          </span>
        </header>

        {/* Tab selection */}
        <div className="lg:px-8 px-4 pt-6">
          <div className="flex gap-1.5 border-b border-white/5 pb-px w-full max-w-xl">
            <button
              onClick={() => handleTabChange("daily")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "daily"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily Routine</span>
            </button>

             <button
              onClick={() => handleTabChange("ladder")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "ladder"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Smart Ladder</span>
            </button>

            <button
              onClick={() => handleTabChange("aptitude")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "aptitude"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Smart Aptitude (AI)</span>
            </button>

            <button
              onClick={() => handleTabChange("behavioral")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "behavioral"
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Behavioral & Case Prep</span>
            </button>
          </div>
        </div>

        {/* Dashboard contents */}
        <div className="lg:p-8 p-4 max-w-5xl w-full mx-auto space-y-8 animate-fadeIn">
          
          {activeTab === "ladder" && (
            <div className="space-y-6">
              {/* Dynamic Generator Parameters Form */}
              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-violet-400" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Configure Bespoke AI Problem Ladder</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Tracks filter selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ladder Platform Track</label>
                    <div className="flex flex-wrap gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      {(["Mixed", "DSA/CP", "SQL", "Puzzles"] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setLadderType(type)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 transition-all select-none ${
                            ladderType === type
                              ? "bg-violet-600/20 text-violet-300 border border-violet-500/25"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ladder Length (Problems)</label>
                    <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      {([10, 15, 20] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => setLadderSize(size)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 transition-all select-none ${
                            ladderSize === size
                              ? "bg-violet-600/20 text-violet-300 border border-violet-500/25"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {size} Items
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Curve selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Difficulty Progression Curve</label>
                    <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      {(["Standard", "Steep", "Linear"] as const).map(curve => (
                        <button
                          key={curve}
                          onClick={() => setLadderDifficulty(curve)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 transition-all select-none ${
                            ladderDifficulty === curve
                              ? "bg-violet-600/20 text-violet-300 border border-violet-500/25"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {curve}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Rating / Specific Difficulties Tier Selection row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/[0.02]">
                  {/* Rating selection (shown for DSA/CP / Mixed) */}
                  {(ladderType === "DSA/CP" || ladderType === "Mixed") && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Target Codeforces Rating Tier</label>
                      <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {(["1100-1200", "1300-1400", "1500-1600", "1700-1800"] as const).map(tier => (
                          <button
                            key={tier}
                            onClick={() => setCfRatingTier(tier)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 transition-all select-none ${
                              cfRatingTier === tier
                                ? "bg-violet-600/20 text-violet-300 border border-violet-500/25"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specific Difficulty selection (shown for SQL / Puzzles / Mixed / DSA/CP) */}
                  {(ladderType === "SQL" || ladderType === "Puzzles" || ladderType === "Mixed" || ladderType === "DSA/CP") && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Target Difficulty (SQL, CF & Puzzles)</label>
                      <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {(["Mixed", "Easy", "Medium", "Hard"] as const).map(diff => (
                          <button
                            key={diff}
                            onClick={() => setTargetDifficulty(diff)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 transition-all select-none ${
                              targetDifficulty === diff
                                ? "bg-violet-600/20 text-violet-300 border border-violet-500/25"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {diff === "Mixed" ? "Mixed (Progression Curve)" : diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium leading-normal">
                    <Info className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Analyzes XP: {profile.xp} • Streaks: {profile.streak} Days to generate the optimal learning path.</span>
                  </div>

                  <button
                    onClick={triggerGenerateLadder}
                    disabled={generating}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all select-none active:scale-95 disabled:opacity-50"
                  >
                    {generating ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                        <span>AI Generating...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 fill-current" />
                        <span>Generate AI ladder</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* My Saved Ladders Section */}
              {savedLadders.length > 0 && (
                <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm space-y-4">
                  <button 
                    onClick={() => setIsSavedLaddersOpen(!isSavedLaddersOpen)}
                    className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-violet-400" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">My Saved Ladders ({savedLadders.length})</h3>
                    </div>
                    {isSavedLaddersOpen ? <ChevronDown className="h-4.5 w-4.5 text-zinc-400" /> : <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />}
                  </button>
                  
                  {isSavedLaddersOpen && (
                    <div className="grid grid-cols-1 gap-4 pt-2 animate-fadeIn">
                      {savedLadders.map((lad) => (
                        <div key={lad.id} className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-white leading-normal">{lad.name}</h4>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-violet-600/15 border border-violet-500/20 text-violet-300 w-fit block font-bold uppercase tracking-wider">
                              {lad.type} Track
                            </span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleLoadSavedLadder(lad)}
                              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white transition-all cursor-pointer flex-1 sm:flex-none"
                            >
                              Load Ladder
                            </button>
                            <button
                              onClick={() => handleDeleteSavedLadder(lad.id)}
                              className="px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-bold transition-all cursor-pointer flex-1 sm:flex-none"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                {/* Ladder rendering */}
                {activeLadder.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers className="h-4.5 w-4.5 text-zinc-500" />
                        Progressive AI Problem Ladder ({ladderType} Track)
                      </h3>
                      <span className="text-[10px] text-zinc-500 block leading-normal">
                        ℹ️ This generated ladder is saved in your profile. You can access it anytime here in this console on any device. Solve problems by clicking <strong>Accept & Sync</strong> below.
                      </span>
                    </div>
                    <button
                      onClick={handleSaveAndSyncLadder}
                      className="px-3.5 py-1.5 rounded-xl border border-violet-500/20 bg-violet-600/10 hover:bg-violet-600/25 text-violet-300 hover:text-white font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all select-none cursor-pointer shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                      <span>Save & Sync Current Ladder</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {activeLadder.map((prob) => {
                      const isAdded = acceptedProblems[prob.id];
                      return (
                        <div 
                          key={prob.id} 
                          className="p-5 rounded-2xl border border-white/5 bg-zinc-900/20 hover:border-white/10 transition-all space-y-4 relative group"
                        >
                          {/* Header section */}
                          <div className="flex justify-between items-start md:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{prob.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-semibold border ${
                                  prob.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                  prob.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                  "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                }`}>
                                  {prob.difficulty}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[8px] font-semibold bg-white/[0.03] border border-white/5 text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                  {getPlatformIcon(prob.platform)}
                                  <span>{prob.platform}</span>
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed font-medium pt-1.5">{prob.details}</p>
                            </div>

                            {/* Accept / Sync state button */}
                            <button
                              onClick={() => handleAcceptProblem(prob)}
                              disabled={isAdded}
                              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 select-none ${
                                isAdded
                                  ? "border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 cursor-default"
                                  : "bg-white/[0.02] border border-white/5 text-zinc-300 hover:text-white hover:bg-white/[0.04] active:scale-95 cursor-pointer"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Synced & Active</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="h-4 w-4 text-violet-400" />
                                  <span>{prob.platform === "Codeforces" || prob.platform === "LeetCode" ? "Accept & Solve" : "Accept & Sync"}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Reveal hints/solutions blocks */}
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.02]">
                            {/* Hints reveal */}
                            <div className="flex-1 min-w-[200px] space-y-2">
                              <button
                                onClick={() => setRevealedHints(prev => ({ ...prev, [prob.id]: !prev[prob.id] }))}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                              >
                                {revealedHints[prob.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <span>REVEAL PROBLEM HINT</span>
                              </button>
                              {revealedHints[prob.id] && (
                                <p className="p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] text-zinc-400 leading-relaxed animate-fadeIn">
                                  💡 {prob.hint}
                                </p>
                              )}
                            </div>

                            {/* Answers reveal */}
                            <div className="flex-1 min-w-[200px] space-y-2">
                              <button
                                onClick={() => setRevealedAnswers(prev => ({ ...prev, [prob.id]: !prev[prob.id] }))}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                              >
                                {revealedAnswers[prob.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <span>REVEAL AI SOLUTION rubrics</span>
                              </button>
                              {revealedAnswers[prob.id] && (
                                <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] text-zinc-400 leading-relaxed animate-fadeIn font-mono">
                                  🔑 {prob.answer}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-16 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center space-y-4">
                  <HelpCircle className="h-12 w-12 text-zinc-600 animate-bounce" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-300">No active AI problem ladder generated yet.</p>
                    <p className="text-xs text-zinc-500 max-w-sm">Use the config dashboard above to compile custom progressively harder routines designed specifically to sharpen your capabilities.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "daily" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-violet-400" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI Suggested Daily Practice Routine</h3>
                </div>
                
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  We balance standard cognitive practice intervals across platform variations. Complete the target routines below to earn an incremental **+50 XP bonus**!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  {/* SQL tasks */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Track 1: Databases</span>
                      <h4 className="font-bold text-xs text-white">2 SQL Solves Daily</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Practice relational join mapping, aggregates, or index queries in SQLite sandbox.</p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg w-fit">Pending Practice</span>
                  </div>

                  {/* Puzzles task */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Track 2: Analytical</span>
                      <h4 className="font-bold text-xs text-white">1 Puzzle Solve Daily</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Practice mathematical probabilities, combinatorics, or coin weight riddles.</p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg w-fit">Pending Practice</span>
                  </div>

                  {/* DSA task */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">Track 3: Algorithms</span>
                      <h4 className="font-bold text-xs text-white">1 DSA / CP Challenge</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Synchronize one Codeforces rating submit or standard Leetcode structures problem.</p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg w-fit">Pending Practice</span>
                  </div>
                </div>
                {/* Daily Progress Diagnostics Checklist */}
                {(() => {
                  const todayStr = getLocalTodayStr();
                  const sqlSolvedTodayCount = profile.solvedSql.filter(id => profile.solvedSqlAnswers?.[id + "_date"] === todayStr).length;
                  const puzzlesSolvedTodayCount = profile.solvedPuzzles.filter(id => profile.solvedPuzzleAnswers?.[id + "_date"] === todayStr).length;
                  const dsaSolvedTodayCount = profile.solvedList.filter(id => profile.solvedPuzzleAnswers?.[id + "_date"] === todayStr).length;

                  const isSqlDone = sqlSolvedTodayCount >= 2;
                  const isPuzDone = puzzlesSolvedTodayCount >= 1;
                  const isDsaDone = dsaSolvedTodayCount >= 1;

                  const doneFraction = ( (isSqlDone ? 1 : 0) + (isPuzDone ? 1 : 0) + (isDsaDone ? 1 : 0) ) / 3;

                  return (
                    <div className="border-t border-white/5 pt-5 space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                        Daily XP Multiplier & Diagnostics Funnel
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSqlDone}
                              readOnly
                              className="h-4 w-4 rounded border-white/5 bg-black/40 text-violet-500 focus:ring-0 focus:ring-offset-0 shrink-0 mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Complete 2 SQL Sandbox Solves</span>
                              <span className="text-[10px] text-zinc-500 leading-normal font-medium block">
                                Status: {sqlSolvedTodayCount} / 2 completed today
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 border-t border-white/[0.02] pt-3.5">
                            <input
                              type="checkbox"
                              checked={isPuzDone}
                              readOnly
                              className="h-4 w-4 rounded border-white/5 bg-black/40 text-violet-500 focus:ring-0 focus:ring-offset-0 shrink-0 mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Complete 1 Logic Puzzle Solve</span>
                              <span className="text-[10px] text-zinc-500 leading-normal font-medium block">
                                Status: {puzzlesSolvedTodayCount} / 1 completed today
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 border-t border-white/[0.02] pt-3.5">
                            <input
                              type="checkbox"
                              checked={isDsaDone}
                              readOnly
                              className="h-4 w-4 rounded border-white/5 bg-black/40 text-violet-500 focus:ring-0 focus:ring-offset-0 shrink-0 mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Complete 1 DSA / CP Challenge</span>
                              <span className="text-[10px] text-zinc-500 leading-normal font-medium block">
                                Status: {dsaSolvedTodayCount} / 1 completed today
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-violet-500/10 bg-violet-500/[0.01] flex flex-col justify-between space-y-3.5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block flex items-center gap-1">
                              <Zap className="h-3 w-3 text-violet-400" />
                              XP Multiplier active
                            </span>
                            <h4 className="font-bold text-xs text-white">Daily Solver Multiplier: 2.0x</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                              Complete all three checklist objectives within today's session to automatically double your total reward XP payouts and retain your high active solver ranking score!
                            </p>
                          </div>

                          {/* Diagnostic progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                              <span>Routine Progress</span>
                              <span>{Math.round(doneFraction * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                              <div 
                                className="h-full bg-violet-600 rounded-full transition-all duration-500" 
                                style={{ width: `${doneFraction * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === "behavioral" && (
            <div className="space-y-6">
              {/* Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Left Column (Guesstimates & Curated Qs) */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                  {/* AI Behavioral Cases & Guesstimates Card */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4.5 w-4.5 text-violet-400" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI Behavioral Cases & Guesstimates</h3>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      Elite tech and quant companies frequently grill candidates on guesstimates and business operations latency models. Review typical templates generated by our AI below:
                    </p>

                    <div className="space-y-4 pt-2">
                      {casePrepQuestions.map((q) => {
                        const isExpanded = expandedCaseId === q.id;
                        return (
                          <div 
                            key={q.id} 
                            className="p-5 rounded-xl border border-white/5 bg-black/40 space-y-3 transition-all"
                          >
                            <div className="flex justify-between items-start md:items-center gap-2">
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                                  q.type === "Guesstimate" ? "border-violet-500/20 text-violet-400 bg-violet-500/5" : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                                }`}>
                                  {q.type}
                                </span>
                                <h4 className="font-bold text-xs text-white pt-1">{q.title}</h4>
                              </div>

                              <button
                                onClick={() => setExpandedCaseId(isExpanded ? null : q.id)}
                                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-white transition-all cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                              </button>
                            </div>

                            <p className="text-[11px] text-zinc-500 leading-relaxed">{q.question}</p>

                            {isExpanded && (
                              <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-lg text-xs text-zinc-400 leading-relaxed space-y-2 animate-fadeIn">
                                <strong className="text-zinc-300 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  Solution Rubric & Expected Structuring
                                </strong>
                                <p className="font-medium">{q.rubric}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Curated Top Tech Behavioral Questions Accordion (NEW!) */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Top Tech Behavioral Questions & Rubrics</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      Master the behavioral filters at FAANG and startups. Tap a prompt below to see the expected answer structure:
                    </p>

                    <div className="space-y-4 pt-2">
                      {[
                        {
                          id: 10,
                          q: "Tell me about a time you had a conflict with a teammate or peer.",
                          tip: "Focus on empathy, communication, and professional resolution. Never speak poorly of others.",
                          rubric: "1. Situation: Working on a tight database migration. Teammate proposed a risky schema modification without checks.\n2. Task: Address the conflict without causing friction or delaying progress.\n3. Action: Took them to a private call, highlighted risks using documentation rather than personal opinion, and proposed a sandbox simulation.\n4. Result: Simulated both options, teammate agreed the sandbox caught 2 major edge-case errors, and migrated safely without delays."
                        },
                        {
                          id: 11,
                          q: "Describe a challenging technical problem you solved.",
                          tip: "Explain the complexity in simple terms, detail your debugging steps, and emphasize the positive outcomes.",
                          rubric: "1. Situation: A production API latency spiked by 400% during traffic surges.\n2. Task: Isolate and optimize the bottleneck within 24 hours.\n3. Action: Instrumented logs with trace IDs, isolated an unindexed query inside a nested loop, refactored it to use joins and added a redis edge-caching layer.\n4. Result: Latency reduced by 85% and infrastructure load cut by 40%."
                        }
                      ].map((item) => {
                        const isExpanded = expandedCaseId === item.id;
                        return (
                          <div key={item.id} className="p-5 rounded-xl border border-white/5 bg-black/40 space-y-3 transition-all">
                            <div className="flex justify-between items-start md:items-center gap-2">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Behavioral Interview Prompt</span>
                                <h4 className="font-bold text-xs text-white pt-1">{item.q}</h4>
                              </div>
                              <button
                                onClick={() => setExpandedCaseId(isExpanded ? null : item.id)}
                                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-white transition-all cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-lg text-xs text-zinc-400 leading-relaxed space-y-3 animate-fadeIn">
                                <p className="text-[10px] text-zinc-500 italic">💡 Coach Tip: {item.tip}</p>
                                <hr className="border-white/5" />
                                <strong className="text-zinc-300 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  Ideal STAR Answer Formula
                                </strong>
                                <pre className="font-sans whitespace-pre-line leading-relaxed font-medium text-zinc-400">{item.rubric}</pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* My Saved STAR Cheat Sheets Card (NEW!) */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-violet-400" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">My Saved STAR Cheat Sheets ({savedStarStories.length})</h3>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-violet-600/10 border border-violet-500/20 text-violet-300 font-bold uppercase tracking-wider">
                        Personal Repository
                      </span>
                    </div>

                    {savedStarStories.length === 0 ? (
                      <div className="p-8 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center space-y-3 flex-1">
                        <BookOpen className="h-8 w-8 text-zinc-600 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-zinc-400">No STAR sheets saved yet.</p>
                          <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            Draft your customized STAR answers using the Builder on the right. Once saved, they will display here as dynamic, reviewable cards to help you ace your next interview.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2 max-h-[400px] overflow-y-auto pr-1">
                        {savedStarStories.map((story, idx) => {
                          const isExpanded = expandedCaseId === (20 + idx);
                          return (
                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3 transition-all">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Saved: {story.date}
                                  </span>
                                  <h4 className="font-bold text-xs text-white leading-relaxed">{story.prompt}</h4>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setExpandedCaseId(isExpanded ? null : (20 + idx))}
                                    className="p-1 rounded-lg hover:bg-white/[0.03] text-zinc-500 hover:text-white transition-all cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4.5 w-4.5" />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = savedStarStories.filter(s => s.prompt !== story.prompt);
                                      setSavedStarStories(updated);
                                      if (typeof window !== "undefined") {
                                        localStorage.setItem("ic_saved_star_stories", JSON.stringify(updated));
                                      }
                                      showToast("STAR story deleted.");
                                    }}
                                    className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                                    title="Delete"
                                  >
                                    <span className="text-[10px] font-bold px-1 block">×</span>
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.03] animate-fadeIn text-xs">
                                  <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-lg space-y-1">
                                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Situation</span>
                                    <p className="text-zinc-300 leading-relaxed font-medium">{story.situation}</p>
                                  </div>
                                  <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-lg space-y-1">
                                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Task</span>
                                    <p className="text-zinc-300 leading-relaxed font-medium">{story.task}</p>
                                  </div>
                                  <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-lg space-y-1">
                                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Action</span>
                                    <p className="text-zinc-300 leading-relaxed font-medium">{story.action}</p>
                                  </div>
                                  <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-lg space-y-1">
                                    <span className="text-[9px] font-bold text-emerald-450 uppercase tracking-widest text-emerald-400">Result</span>
                                    <p className="text-zinc-300 leading-relaxed font-medium">{story.result}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (STAR Framework Builder & Pro Tips) */}
                <div className="flex flex-col gap-6 h-full">
                  {/* STAR Builder */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 animate-fadeIn">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI STAR Framework Builder</h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        Select a prompt below, then write your custom STAR response to build your personal behavioral cheat sheet:
                      </p>

                      {/* Prompt Selector */}
                      <select 
                        value={activeStarPrompt}
                        onChange={(e) => {
                          setActiveStarPrompt(e.target.value);
                          setStarSaved(false);
                        }}
                        className="w-full bg-black/60 border border-white/5 text-xs text-zinc-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="Tell me about a time you solved a challenging technical bug.">Challenge: Solving a Technical Bug</option>
                        <option value="Tell me about a time you had a conflict with a teammate or peer.">Conflict: Conflict with a Peer</option>
                        <option value="Describe a project where you demonstrated leadership.">Leadership: Demonstrating Leadership</option>
                        <option value="Tell me about a time you failed and what you learned.">Failure: Overcoming Failure</option>
                      </select>

                      {/* STAR Forms */}
                      <div className="space-y-3.5 pt-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Situation (Set the scene)</label>
                          <textarea
                            value={starSituation}
                            onChange={(e) => { setStarSituation(e.target.value); setStarSaved(false); }}
                            placeholder="What was the project, timeline, and issue?"
                            rows={2}
                            className="w-full bg-black/40 border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:outline-none focus:border-violet-500 placeholder-zinc-700 leading-relaxed resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Task (Identify the objective)</label>
                          <textarea
                            value={starTask}
                            onChange={(e) => { setStarTask(e.target.value); setStarSaved(false); }}
                            placeholder="What was your target, constraint, or goal?"
                            rows={2}
                            className="w-full bg-black/40 border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:outline-none focus:border-violet-500 placeholder-zinc-700 leading-relaxed resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Action (Detail your steps)</label>
                          <textarea
                            value={starAction}
                            onChange={(e) => { setStarAction(e.target.value); setStarSaved(false); }}
                            placeholder="How did you solve it? Explain your exact actions."
                            rows={3}
                            className="w-full bg-black/40 border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:outline-none focus:border-violet-500 placeholder-zinc-700 leading-relaxed resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Result (Explain the positive outcome)</label>
                          <textarea
                            value={starResult}
                            onChange={(e) => { setStarResult(e.target.value); setStarSaved(false); }}
                            placeholder="What did you achieve? Use percentages or numbers."
                            rows={2}
                            className="w-full bg-black/40 border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:outline-none focus:border-violet-500 placeholder-zinc-700 leading-relaxed resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!starSituation || !starTask || !starAction || !starResult) {
                            alert("Please fill in all sections to build your STAR sheet!");
                            return;
                          }
                          const newStory = {
                            prompt: activeStarPrompt,
                            situation: starSituation,
                            task: starTask,
                            action: starAction,
                            result: starResult,
                            date: new Date().toLocaleDateString()
                          };
                          const updated = [newStory, ...savedStarStories.filter(s => s.prompt !== activeStarPrompt)];
                          setSavedStarStories(updated);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("ic_saved_star_stories", JSON.stringify(updated));
                          }
                          setStarSaved(true);
                          showToast("STAR framework cheat sheet saved to local profile!");
                        }}
                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all cursor-pointer select-none active:scale-[0.99]"
                      >
                        {starSaved ? "✓ STAR Cheat Sheet Saved" : "Save STAR Answer to Cheat Sheet"}
                      </button>

                      {starSaved && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 leading-relaxed font-medium animate-fadeIn">
                          🎉 Excellent! Your formatted STAR sheet has been compiled. You can review and recite this template to ace behavioral rounds at tech companies.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Cheat Sheet & Interactive Pro Tips Card */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 animate-fadeIn flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI Behavioral Delivery Guide</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Interactive Timing Guideline Visual */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ideal Story Time Distribution</span>
                        <div className="h-4 w-full rounded-lg bg-zinc-950 overflow-hidden flex text-[8px] font-extrabold text-white text-center leading-4 select-none">
                          <div className="bg-violet-650/40 text-violet-300 border-r border-white/5" style={{ width: "15%" }} title="Situation">S: 15%</div>
                          <div className="bg-violet-600/35 text-violet-300 border-r border-white/5" style={{ width: "15%" }} title="Task">T: 15%</div>
                          <div className="bg-violet-650 text-white border-r border-white/5" style={{ width: "55%" }} title="Action">Action: 55%</div>
                          <div className="bg-emerald-600 text-emerald-100" style={{ width: "15%" }} title="Result">Result: 15%</div>
                        </div>
                        <span className="text-[9px] text-zinc-500 leading-normal block font-medium">
                          ⚠️ Avoid long descriptions. Spend over 50% of your time talking about your concrete individual <strong>Actions</strong>!
                        </span>
                      </div>

                      <hr className="border-white/5" />

                      {/* Mock Interview Checklist */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Delivery Checklist</span>
                        <div className="space-y-2 pt-1">
                          {[
                            "Quantified outcomes (e.g., 'reduced database sync lag by 35%')",
                            "Focused on 'I did' instead of collective team outcomes ('we did')",
                            "Framed peer conflicts constructively without badmouthing",
                            "Shared a lessons-learned take-away for failure scenarios"
                          ].map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-medium text-zinc-400">
                              <input 
                                type="checkbox" 
                                className="h-3.5 w-3.5 rounded border-white/5 bg-black/40 text-violet-500 focus:ring-0 focus:ring-offset-0 shrink-0 mt-0.5"
                              />
                              <span className="leading-normal">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-white/5" />

                      {/* Power Verbs */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">High-Impact Power Verbs</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["Optimized", "Architected", "Spearheaded", "Refactored", "Resolved", "Mitigated"].map(verb => (
                            <span 
                              key={verb} 
                              className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/[0.02] border border-white/5 text-zinc-400 hover:text-zinc-300 transition-all select-none"
                            >
                              {verb}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "aptitude" && (
            <div className="space-y-6">
              {/* Top Overview Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Attempts</span>
                  <span className="text-2xl font-bold text-white block">{aptStats.solvedCount}</span>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Correct Answers</span>
                  <span className="text-2xl font-bold text-emerald-400 block">{aptStats.correctCount}</span>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Accuracy Rate</span>
                  <span className="text-2xl font-bold text-violet-400 block">
                    {aptStats.solvedCount > 0 ? Math.round((aptStats.correctCount / aptStats.solvedCount) * 100) : 0}%
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Solve Time</span>
                  <span className="text-2xl font-bold text-sky-400 block">{aptStats.averageSpeedSec}s</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Left Columns (Challenges and Exam Mode) */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                  {/* Daily AI-Generated Aptitude Sets */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Award className="h-4.5 w-4.5 text-violet-400" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Daily AI‑generated aptitude set</h3>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                        Live Adaptive Engine
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      These questions adapt in real-time. Correct answers boost you to harder tiers (+15 XP), incorrect choices display instant AI rubrics.
                    </p>

                    <div className="space-y-6 pt-2">
                      {aptitudeSet.map((q, idx) => {
                        const answeredOption = aptitudeAnswers[q.id];
                        const isAnswered = !!answeredOption;
                        const isCorrect = answeredOption === q.answer;
                        const showExplanation = aptitudeRevealed[q.id];
                        
                        return (
                          <div key={q.id} className="p-5 rounded-xl border border-white/5 bg-black/40 space-y-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                                    Q{idx + 1}: {q.category}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-semibold border ${
                                    q.difficulty === "Easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                    q.difficulty === "Medium" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                    "border-rose-500/20 text-rose-400 bg-rose-500/5"
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                                <h4 className="font-bold text-xs text-white leading-relaxed pt-1">{q.question}</h4>
                              </div>

                              {/* One-click Action Triggers */}
                              <div className="flex gap-1.5 shrink-0 items-center">
                                {isAnswered && (
                                  <button
                                    onClick={() => handleLoadNextAptitudeQuestion(q)}
                                    title="Load Next Question"
                                    className="px-3 py-1.5 rounded-xl border border-violet-500/20 bg-violet-650 hover:bg-violet-600 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                                  >
                                    <span>Next Q</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleAddAptitudeToDailyRoutine(q)}
                                  title="Add to Daily Routine"
                                  className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAddAptitudeToTimedPractice(q)}
                                  title="Add to Timed Practice"
                                  className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                  <TimerIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Options List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                              {q.options.map(opt => {
                                const isSelected = answeredOption === opt;
                                const isCorrectOpt = opt === q.answer;
                                
                                let optClass = "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-zinc-300";
                                if (isAnswered) {
                                  if (isCorrectOpt) optClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-bold";
                                  else if (isSelected) optClass = "border-rose-500/30 bg-rose-500/10 text-rose-300 font-bold";
                                  else optClass = "border-white/5 bg-white/[0.01] text-zinc-600 opacity-60";
                                }

                                return (
                                  <button
                                    key={opt}
                                    onClick={() => handleAptitudeAnswerSelect(q, opt)}
                                    disabled={isAnswered}
                                    className={`px-4 py-3 rounded-xl border text-left text-xs font-semibold transition-all ${optClass} ${!isAnswered ? "cursor-pointer active:scale-[0.99]" : ""}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {/* AI Detailed Explanation section */}
                            {showExplanation && (
                              <div className="p-4 bg-zinc-950/90 border border-violet-500/10 rounded-xl space-y-2.5 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                  <strong className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">
                                    💡 Instant AI Explanation
                                  </strong>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isCorrect ? "Correct Choice" : "Incorrect Choice"}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                  {q.explanation}
                                </p>
                                <div className="border-t border-white/5 pt-3 mt-2 flex justify-between items-center">
                                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Challenge Resolved</span>
                                  <button
                                    onClick={() => handleLoadNextAptitudeQuestion(q)}
                                    className="px-3.5 py-1.5 rounded-lg bg-violet-650 hover:bg-violet-650/80 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-violet-600/20"
                                  >
                                    <span>Next {q.category} Challenge</span>
                                    <ArrowRight className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI-powered Exam Mode Simulator */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4.5 w-4.5 text-violet-400" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">AI‑powered ‘Exam Mode’</h3>
                      </div>
                      <span className="text-[9px] px-2.5 py-1 rounded-full bg-violet-600/15 border border-violet-500/20 text-violet-300 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
                        Simulate Mock Tests
                      </span>
                    </div>

                    {!examActive && !examFinished && (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                          Simulate high-stakes, company-specific technical aptitude pre-tests. Experience strict timed countdown intervals, scoring scales, and specialized reward XP packages.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                          {(["Infosys", "TCS", "IBM", "FAANG"] as const).map(company => (
                            <button
                              key={company}
                              onClick={() => startExamCompany(company)}
                              className="px-4 py-3.5 rounded-xl border border-white/5 bg-black/40 hover:border-violet-500/20 hover:bg-violet-600/5 text-zinc-300 hover:text-white transition-all text-center flex flex-col justify-between items-center gap-2 cursor-pointer active:scale-95 group"
                            >
                              <span className="font-extrabold text-xs tracking-wide group-hover:scale-105 transition-all">{company}</span>
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">
                                {company === "Infosys" ? "30m • 10 Qs" :
                                 company === "TCS" ? "35m • 12 Qs" :
                                 company === "IBM" ? "20m • 8 Qs" :
                                 "40m • 12 Qs"}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Pre-test Strategy & Rules (NEW!) */}
                        <div className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3.5 mt-4">
                          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            AI Simulator Guidelines & Parameters
                          </span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] text-zinc-400 leading-relaxed font-medium">
                            <div className="space-y-1">
                              <span className="text-zinc-200 font-semibold block">🎯 Adaptive Grading</span>
                              <span className="text-zinc-500">Live engine adjusts upcoming question difficulty dynamically based on your correctness track record.</span>
                            </div>
                            <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/5 pt-3.5 md:pt-0 md:pl-4">
                              <span className="text-zinc-200 font-semibold block">⚡ XP Bonuses</span>
                              <span className="text-zinc-500">Score &gt;= 70% yields +75 XP. Achieving a perfect 100% score awards +100 bonus XP instantly.</span>
                            </div>
                            <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/5 pt-3.5 md:pt-0 md:pl-4">
                              <span className="text-zinc-200 font-semibold block">🧠 FAANG & Startup Specs</span>
                              <span className="text-zinc-500">FAANG tier draws high-difficulty questions across mixed quantitative, logical, and verbal categories.</span>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 text-[9px] text-zinc-600 leading-normal block font-medium italic">
                            💡 Pro Tip: Once started, the countdown timer cannot be paused. Refreshing the browser sessions will auto-submit the exam under current answers.
                          </div>
                        </div>

                        {/* Simulation History Block (NEW!) */}
                        <div className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3 mt-4 flex-1 flex flex-col justify-center min-h-[240px]">
                          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            AI Simulation Practice History
                          </span>

                          {examHistory.length === 0 ? (
                            <div className="text-center py-4 space-y-1.5 flex-1 flex flex-col justify-center">
                              <p className="text-[11px] font-bold text-zinc-400">No mock attempts recorded yet</p>
                              <p className="text-[9px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                                Choose a target pre-test from the options above (TCS, Infosys, IBM, FAANG) to start testing your speed & precision under realistic conditions!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {examHistory.map((hist, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] py-1.5 border-b border-white/[0.02] last:border-b-0">
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-zinc-300 block">{hist.company}</span>
                                    <span className="text-zinc-500 text-[9px] block">Duration: {hist.time} • {hist.xp}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 font-medium">{hist.score}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      hist.status === "Passed" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                    }`}>
                                      {hist.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Exam Mode Screen */}
                    {examActive && (
                      <div className="space-y-6 border-t border-white/5 pt-4 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Active: {examCompany} Mock Test</h4>
                            <span className="text-[10px] text-zinc-500 block leading-normal">
                              Solve all mock questions before the clock expires!
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Pause / Resume Button */}
                            <button
                              onClick={() => setExamPaused(!examPaused)}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                examPaused
                                  ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20"
                                  : "bg-amber-600/10 border-amber-500/20 text-amber-400 hover:bg-amber-600/20"
                              }`}
                            >
                              {examPaused ? "▶ Resume" : "⏸ Pause"}
                            </button>

                            {/* Cancel Button */}
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this mock test? Your progress will be lost.")) {
                                  setExamActive(false);
                                  setExamFinished(false);
                                  setExamCompany(null);
                                  setExamPaused(false);
                                  showToast("Mock test cancelled.");
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border bg-rose-600/10 border-rose-500/20 text-rose-450 hover:bg-rose-650/20 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              ✕ Cancel
                            </button>

                            {/* Timer Display */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 font-extrabold text-xs tracking-wider select-none shrink-0">
                              <Clock className="h-4 w-4 animate-pulse" />
                              <span className={examPaused ? "text-zinc-500 line-through" : "text-white"}>
                                {Math.floor(examTimeRemaining / 60)}:
                                {String(examTimeRemaining % 60).padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {examPaused ? (
                          <div className="p-8 rounded-xl border border-dashed border-white/10 bg-black/40 text-center py-16 flex flex-col items-center justify-center space-y-3.5 animate-fadeIn">
                            <Clock className="h-10 w-10 text-amber-400 animate-bounce" />
                            <div className="space-y-1">
                              <h5 className="font-extrabold text-sm text-white uppercase tracking-wider">AI Mock Test Paused</h5>
                              <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                                The countdown clock is currently stopped. To ensure diagnostic fairness, questions are blurred until the test is resumed.
                              </p>
                            </div>
                            <button
                              onClick={() => setExamPaused(false)}
                              className="px-6 py-2.5 rounded-xl bg-violet-650 hover:bg-violet-600 text-xs font-bold text-white shadow-lg shadow-violet-600/20 cursor-pointer active:scale-95 transition-all select-none uppercase tracking-wider"
                            >
                              Resume Mock Test
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {examQuestions.map((q, idx) => {
                              const selected = examAnswers[q.id];
                              return (
                                <div key={q.id} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-3">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Question {idx + 1} ({q.category})</span>
                                  <h5 className="font-bold text-xs text-zinc-200 leading-relaxed">{q.question}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                    {q.options.map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                        className={`px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                                          selected === opt
                                            ? "border-violet-500 bg-violet-600/10 text-white font-bold"
                                            : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-zinc-400 hover:text-white"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <button
                          onClick={() => finishExam(examAnswers, examQuestions)}
                          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all cursor-pointer active:scale-98 select-none uppercase tracking-widest block"
                        >
                          Submit and Complete Exam
                        </button>
                      </div>
                    )}

                    {/* Exam Finished Score Screen */}
                    {examFinished && (
                      <div className="space-y-5 border-t border-white/5 pt-4 text-center animate-fadeIn py-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 mx-auto font-bold animate-bounce">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white uppercase tracking-wider">AI Mock Pre-test Completed!</h4>
                          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                            Your scores and precision analytics have been aggregated into your general coach profile statistics successfully!
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-white/5 bg-black/40 max-w-xs mx-auto space-y-2">
                          <div className="flex justify-between text-xs font-bold text-zinc-400">
                            <span>Mock Company:</span>
                            <span className="text-white font-extrabold uppercase">{examCompany}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-zinc-400">
                            <span>Mock Score:</span>
                            <span className="text-emerald-400 font-extrabold">{examScore} / {examQuestions.length} Correct</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setExamFinished(false);
                            setExamCompany(null);
                          }}
                          className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                        >
                          Back to Exam Options
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Solved Aptitude History — fills remaining space in left column */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Solved Aptitude History</h3>
                    </div>

                    {(() => {
                      // Build solved history from profile.solvedPuzzleAnswers or profile.solvedPuzzles cross-referenced with APTITUDE_POOL
                      const solvedItems = APTITUDE_POOL.filter(
                        q => (profile?.solvedPuzzleAnswers?.[q.id] !== undefined) || (profile?.solvedPuzzles?.includes(q.id))
                      ).map(q => {
                        const ans = profile?.solvedPuzzleAnswers?.[q.id] || q.answer;
                        const isCorrect = ans === q.answer || profile?.solvedPuzzles?.includes(q.id);
                        return {
                          ...q,
                          userAnswer: ans,
                          isCorrect,
                        };
                      }).reverse(); // Descending (cross-down) order showing latest solves on top!

                      if (solvedItems.length === 0) {
                        return (
                          <div className="text-center py-6 flex-1 flex flex-col justify-center items-center">
                            <p className="text-[11px] font-bold text-zinc-400">No aptitude solves recorded yet</p>
                            <p className="text-[9px] text-zinc-500 max-w-xs leading-relaxed mt-1">
                              Answer questions from the Daily AI‑generated set above — your solved history will appear here automatically.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 flex-1">
                          {solvedItems.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => setExpandedSolvedId(expandedSolvedId === item.id ? null : item.id)}
                              className="flex flex-col p-3 rounded-xl border border-white/[0.03] bg-black/20 hover:bg-black/30 transition-all cursor-pointer select-none"
                            >
                              <div className="flex items-start gap-3 w-full">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 text-[10px] font-extrabold ${
                                  item.isCorrect
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border border-rose-500/20 text-rose-450"
                                }`}>
                                  {item.isCorrect ? "✓" : "✗"}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <p className={`text-[11px] font-semibold text-zinc-300 leading-snug ${expandedSolvedId === item.id ? "" : "line-clamp-2"}`}>
                                    {item.question}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      item.category === "Quantitative" ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                                      : item.category === "Logical" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                      : item.category === "Verbal" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                                      : item.category === "Technical" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                      : "bg-rose-500/10 border border-rose-500/20 text-rose-450"
                                    }`}>{item.category}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      item.difficulty === "Easy" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                      : item.difficulty === "Medium" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                      : "bg-rose-500/10 border border-rose-500/20 text-rose-450"
                                    }`}>{item.difficulty}</span>
                                  </div>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 self-center transition-transform duration-200 ${expandedSolvedId === item.id ? "rotate-180" : ""}`} />
                              </div>

                              {expandedSolvedId === item.id && (
                                <div
                                  className="mt-3 pt-3 border-t border-white/5 space-y-3 animate-fadeIn text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Options */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Options</span>
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {item.options.map(opt => {
                                        const isSelected = item.userAnswer === opt;
                                        const isAnswer = item.answer === opt;
                                        return (
                                          <div
                                            key={opt}
                                            className={`p-2 rounded-lg border text-left text-[10px] font-medium leading-relaxed transition-all ${
                                              isSelected && isAnswer
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                                                : isSelected && !isAnswer
                                                ? "border-rose-500 bg-rose-500/10 text-rose-450 font-semibold"
                                                : !isSelected && isAnswer
                                                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                                                : "border-white/5 bg-white/[0.01] text-zinc-450"
                                            }`}
                                          >
                                            <div className="flex justify-between items-center">
                                              <span>{opt}</span>
                                              {isSelected && (
                                                <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-black/40 border border-white/5 shrink-0">
                                                  Your Choice
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Explanation */}
                                  <div className="p-2.5 rounded-lg border border-violet-500/10 bg-violet-500/[0.02] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 uppercase tracking-wider">
                                      <Sparkles className="h-3 w-3" />
                                      <span>Explanation</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-350 leading-relaxed font-medium">
                                      {item.explanation}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Column (Domain Progress & Trends) */}
                <div className="flex flex-col gap-6 h-full">
                  {/* Mastery Breakdown */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4.5 w-4.5 text-violet-400" />
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Progress & Mastery Breakdown</h3>
                    </div>

                    <div className="space-y-5">
                      {/* Quantitative */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
                          <span className="uppercase tracking-wider">Quantitative Aptitude</span>
                          <span className="text-white">{aptStats.quantMastery}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-violet-600 rounded-full transition-all duration-500" 
                            style={{ width: `${aptStats.quantMastery}%` }}
                          />
                        </div>
                      </div>

                      {/* Logical */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
                          <span className="uppercase tracking-wider">Logical Reasoning</span>
                          <span className="text-white">{aptStats.logicMastery}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${aptStats.logicMastery}%` }}
                          />
                        </div>
                      </div>

                      {/* Verbal */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
                          <span className="uppercase tracking-wider">Verbal Ability</span>
                          <span className="text-white">{aptStats.verbalMastery}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                            style={{ width: `${aptStats.verbalMastery}%` }}
                          />
                        </div>
                      </div>

                      {/* Technical */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
                          <span className="uppercase tracking-wider">Technical & Coding</span>
                          <span className="text-white">{aptStats.technicalMastery || 0}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                            style={{ width: `${(aptStats.technicalMastery || 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Behavioral */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
                          <span className="uppercase tracking-wider">Behavioral & Cases</span>
                          <span className="text-white">{aptStats.behavioralMastery || 0}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                            style={{ width: `${(aptStats.behavioralMastery || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Improvement trends chart */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
                      Accuracy Trend Line
                    </h3>

                    {/* Chart Container */}
                    <div className="h-[200px] w-full mt-2 select-none pr-3 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => ({
                            day,
                            Solved: (aptStats.dailyHistory?.[day]?.solved) || 0,
                            Correct: (aptStats.dailyHistory?.[day]?.correct) || 0,
                          }))}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="day" stroke="#a1a1aa" fontSize={9} />
                          <YAxis stroke="#a1a1aa" fontSize={9} allowDecimals={false} />
                          <ChartTooltip 
                            contentStyle={{ backgroundColor: "#09090b", borderColor: "#ffffff10", borderRadius: "12px" }}
                            labelStyle={{ color: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                            itemStyle={{ fontSize: "10px", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey="Solved" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0.15} fill="url(#colorApt)" />
                          <Area type="monotone" dataKey="Correct" stroke="#10b981" strokeWidth={2} fillOpacity={0.10} fill="url(#colorAptCorrect)" />
                          <defs>
                            <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="colorAptCorrect" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Coach Recommendations & Formulas Cheat Sheet */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm space-y-4 flex flex-col justify-between flex-1">
                    <div className="space-y-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Aptitude Cheat Sheet & Recommendations</h3>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                        Based on your adaptive analytics, here is your daily customized aptitude recommendation and cheat sheet formula to maximize pre-test scores:
                      </p>

                      {/* Formula Card */}
                      <div className="p-4 rounded-xl border border-violet-500/10 bg-violet-600/[0.02] space-y-2">
                        <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Formula of the Day: Work & Time</span>
                        <h4 className="font-bold text-xs text-white">Assisted Efficiency Theorem</h4>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed bg-black/40 p-2 rounded border border-white/5">
                          1/Total_Time = 1/A + 1/B + 1/C
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-normal font-medium pt-1">
                          Use this when A, B, and C work together. When assisted on alternate days, accumulate work done in cycles (e.g. 3-day blocks) to simplify calculation.
                        </p>
                      </div>

                      {/* AI Coach Insights */}
                      <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] space-y-3 flex-1 flex flex-col justify-between">
                        {aptStats.solvedCount === 0 ? (
                          <div className="space-y-4">
                            <div className="space-y-2.5">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">AI Coach Focus Areas</span>
                              <h4 className="font-bold text-xs text-white">Awaiting Diagnostic Solve</h4>
                              <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                                Your AI Coach is ready to evaluate your skills! Complete your first adaptive daily challenge questions or start a mock exam simulation to analyze speed metrics, category mastery thresholds, and precision statistics.
                              </p>
                              <p className="text-[10px] text-zinc-550 leading-normal font-medium border-t border-emerald-500/10 pt-2.5 mt-2">
                                💡 <em>Diagnostic: Category speed tracking initializes automatically after receiving your first adaptive answer submissions.</em>
                              </p>
                            </div>

                            {/* Diagnostic Onboarding Tasks Checklist */}
                            <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 space-y-2.5">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">AI Onboarding Checklist</span>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                  <div className="h-4 w-4 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center text-[9px] text-zinc-500 font-bold">1</div>
                                  <span>Complete any <strong>Daily Aptitude Challenge</strong> question above</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                  <div className="h-4 w-4 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center text-[9px] text-zinc-500 font-bold">2</div>
                                  <span>Reveal correct answer & review explanation details</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                  <div className="h-4 w-4 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center text-[9px] text-zinc-500 font-bold">3</div>
                                  <span>Simulate 1 timed <strong>AI Mock Pre-test</strong> to record speed benchmark</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">AI Coach Focus Areas</span>
                            <h4 className="font-bold text-xs text-white">Speed & Precision Strategy</h4>
                            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                              You solved <strong>Verbal Ability</strong> questions 15% faster than Quantitative ones.
                              {aptStats.correctCount > 0 && aptStats.solvedCount > 0 && (
                                <> Your overall accuracy is <strong className="text-emerald-400">{Math.round((aptStats.correctCount / aptStats.solvedCount) * 100)}%</strong> across {aptStats.solvedCount} attempts.</>
                              )}
                            </p>

                            {/* Weakest category insight */}
                            {(() => {
                              const cats = [
                                { name: "Quantitative", mastery: aptStats.quantMastery },
                                { name: "Logical", mastery: aptStats.logicMastery },
                                { name: "Verbal", mastery: aptStats.verbalMastery },
                                { name: "Technical", mastery: aptStats.technicalMastery || 0 },
                                { name: "Behavioral", mastery: aptStats.behavioralMastery || 0 },
                              ];
                              const weakest = cats.reduce((a, b) => a.mastery <= b.mastery ? a : b);
                              const strongest = cats.reduce((a, b) => a.mastery >= b.mastery ? a : b);
                              return (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="p-2 rounded-lg border border-rose-500/10 bg-rose-500/[0.02]">
                                    <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest block mb-0.5">Weakest Area</span>
                                    <span className="text-[11px] font-bold text-white">{weakest.name}</span>
                                    <span className="text-[9px] text-zinc-500 block">{weakest.mastery}% mastery</span>
                                  </div>
                                  <div className="p-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02]">
                                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Strongest Area</span>
                                    <span className="text-[11px] font-bold text-white">{strongest.name}</span>
                                    <span className="text-[9px] text-zinc-500 block">{strongest.mastery}% mastery</span>
                                  </div>
                                </div>
                              );
                            })()}

                            <p className="text-[10px] text-zinc-550 leading-normal font-medium border-t border-emerald-500/10 pt-2.5 mt-1">
                              💡 <em>Focus on Quantitative speed drills using unit-digit and cycle-check shortcuts to cut solving latency down by 10s.</em>
                            </p>
                            <p className="text-[10px] text-zinc-550 leading-normal font-medium">
                              🎯 <em>Try mock exams under time pressure — candidates who simulate real conditions score 20–30% higher in placement rounds.</em>
                            </p>
                          </div>
                        )}

                        {/* AI Speed & Latency Calibration - ALWAYS RENDERED */}
                        <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span>AI Speed & Latency Calibration</span>
                            {aptStats.solvedCount > 0 ? (
                              <span className="text-[8px] text-violet-400 lowercase italic">latency analysis active</span>
                            ) : (
                              <span className="text-[8px] text-zinc-500 lowercase italic">awaiting baseline</span>
                            )}
                          </div>
                          
                          <div className="space-y-1.5 w-full">
                            {/* Quantitative */}
                            <div className="p-2 rounded-lg border border-white/[0.02] bg-white/[0.01] flex items-center justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-350 font-semibold block truncate">Quantitative Aptitude</span>
                                <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wider">Target: 45s</span>
                              </div>
                              {aptStats.solvedCount === 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-450 border border-zinc-500/10 shrink-0">Awaiting Solve</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-450 border border-rose-500/10 shrink-0">54s (High Latency)</span>
                              )}
                            </div>

                            {/* Logical */}
                            <div className="p-2 rounded-lg border border-white/[0.02] bg-white/[0.01] flex items-center justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-350 font-semibold block truncate">Logical Reasoning</span>
                                <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wider">Target: 30s</span>
                              </div>
                              {aptStats.solvedCount === 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-450 border border-zinc-500/10 shrink-0">Awaiting Solve</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shrink-0">26s (Optimal)</span>
                              )}
                            </div>

                            {/* Verbal */}
                            <div className="p-2 rounded-lg border border-white/[0.02] bg-white/[0.01] flex items-center justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-350 font-semibold block truncate">Verbal Ability</span>
                                <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wider">Target: 25s</span>
                              </div>
                              {aptStats.solvedCount === 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-450 border border-zinc-500/10 shrink-0">Awaiting Solve</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shrink-0">21s (Optimal)</span>
                              )}
                            </div>

                            {/* Technical */}
                            <div className="p-2 rounded-lg border border-white/[0.02] bg-white/[0.01] flex items-center justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-350 font-semibold block truncate">Technical & Coding</span>
                                <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wider">Target: 60s</span>
                              </div>
                              {aptStats.solvedCount === 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-450 border border-zinc-500/10 shrink-0">Awaiting Solve</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/10 shrink-0">72s (Needs Review)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Calibration Timeline - ALWAYS RENDERED */}
                        <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 space-y-3">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">AI Calibration Roadmap</span>
                          <div className="space-y-3">
                            {/* Step 1 */}
                            <div className="flex gap-2.5 items-start">
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  aptStats.solvedCount > 0
                                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold"
                                    : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-extrabold"
                                }`}>
                                  {aptStats.solvedCount > 0 ? "✓" : "1"}
                                </div>
                                <div className="w-0.5 h-4.5 bg-zinc-800 my-0.5" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className={`text-[8px] font-bold uppercase ${aptStats.solvedCount > 0 ? "text-emerald-400" : "text-emerald-500"}`}>Benchmark Phase</span>
                                <h5 className="text-[10px] font-semibold text-zinc-300">Capture Initial Speed</h5>
                                <p className="text-[8px] text-zinc-550 leading-normal">
                                  {aptStats.solvedCount > 0 ? "Initial benchmark speed captured successfully!" : "Initial daily set solves establish your core baseline solving latency."}
                                </p>
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-2.5 items-start">
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                                  aptStats.solvedCount > 0
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse font-extrabold"
                                    : "bg-zinc-800 border-white/5 text-zinc-400 font-bold"
                                }`}>2</div>
                                <div className="w-0.5 h-4.5 bg-zinc-800 my-0.5" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className={`text-[8px] font-bold uppercase ${aptStats.solvedCount > 0 ? "text-amber-400" : "text-zinc-500"}`}>Calibration Phase</span>
                                <h5 className="text-[10px] font-semibold text-zinc-300">Scale Problem Difficulty</h5>
                                <p className="text-[8px] text-zinc-550 leading-normal">Difficulty scales adaptively based on correct or incorrect responses.</p>
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-2.5 items-start">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="h-5 w-5 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-[9px] font-bold text-zinc-400">3</div>
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Mastery Phase</span>
                                <h5 className="text-[10px] font-semibold text-zinc-300">Target Placement Score</h5>
                                <p className="text-[8px] text-zinc-550 leading-normal">Aggregated stats unlock personalized domain placement readiness.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Focus Action Roadmap */}
                        <div className="border-t border-emerald-500/10 pt-2.5 mt-2.5 space-y-2">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Focus Action Roadmap</span>
                          <ul className="text-[10px] text-zinc-450 space-y-1.5 pl-1.5 list-disc list-inside font-medium leading-relaxed">
                            <li>Benchmark Quant accuracy by running strict FAANG & TCS speed tests</li>
                            <li>Practice cycle-check shortcut logic on Work & Time assisted theorems</li>
                            <li>Review Syllogisms logical deductions for quick elimination</li>
                          </ul>
                        </div>
                      </div>

                      {/* Speed‑Solving Shortcut Card */}
                      <div className="p-4 rounded-xl border border-sky-500/10 bg-sky-500/[0.01] space-y-2">
                        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block">Speed‑Solving Shortcut</span>
                        <h4 className="font-bold text-xs text-white">Digital Root Modulo 9 Shortcut</h4>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed bg-black/40 p-2 rounded border border-white/5">
                          Digital Root (N) = Sum of digits recursively until a single digit remains.
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-normal font-medium pt-1">
                          Verify large multiplications or additions on division tests by checking if the digital root of the question matches the digital root of the options. This eliminates 90% of arithmetic options in 3 seconds!
                        </p>
                      </div>

                      {/* Placement Strategy Pro-Tips Card */}
                      <div className="p-4 rounded-xl border border-teal-500/10 bg-teal-500/[0.01] space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-teal-400" />
                          <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block">AI Prep Wisdom & Strategy</span>
                        </div>
                        <h4 className="font-bold text-xs text-white">Advanced Pre-Test Placement Tactics</h4>
                        <div className="space-y-2">
                          <div className="flex gap-2 items-start text-[10px] text-zinc-400 leading-relaxed">
                            <span className="text-teal-400 font-bold shrink-0">1.</span>
                            <p><strong>The 90-Second Rule:</strong> Never spend over 90 seconds on a single question. Mark it for review, skip, and maximize scoring on easier questions first.</p>
                          </div>
                          <div className="flex gap-2 items-start text-[10px] text-zinc-400 leading-relaxed">
                            <span className="text-teal-400 font-bold shrink-0">2.</span>
                            <p><strong>Digital Root Elimination:</strong> Verify high-value arithmetic by summing digits until a single digit remains, eliminating incorrect options instantly.</p>
                          </div>
                          <div className="flex gap-2 items-start text-[10px] text-zinc-400 leading-relaxed">
                            <span className="text-teal-400 font-bold shrink-0">3.</span>
                            <p><strong>Verbal Tense-Matching:</strong> Solve grammar error identification by checking subject-verb alignment first, which accounts for 75% of pre-test errors.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification Overlay */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-violet-600 border border-violet-500/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/20 animate-fadeIn flex items-center gap-2">
          <Sparkles className="h-4 w-4 fill-current text-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
