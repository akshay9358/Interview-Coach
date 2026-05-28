export interface Puzzle {
  id: string;
  title: string;
  category: "Logic" | "Probability" | "Riddles";
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  hints: string[];
  explanation: string;
  correctAnswers: string[]; // List of acceptable string answers (lowercase normalized)
  placeholder: string;
  options: string[]; // Multiple choice options (MCQ)
}

export const puzzles: Puzzle[] = [
  {
    id: "9-balls-weight",
    title: "9 Balls Weight Puzzle",
    category: "Logic",
    difficulty: "Medium",
    description: "You have 9 identical-looking balls. 8 of them weigh the same, and 1 is slightly heavier. You are given a balance scale. What is the minimum number of weighings needed to identify the heavier ball, and how do you do it?",
    hints: [
      "Instead of splitting the balls 4-4-1, try dividing them into 3 groups of 3.",
      "Weigh group 1 (3 balls) against group 2 (3 balls). If they balance, the heavy ball is in group 3. If they don't, it is in the heavier group.",
      "Once you have isolated a group of 3 balls, repeat the process. Split them into 1-1-1. Weigh one against another."
    ],
    correctAnswers: ["2", "two", "2 weighings", "two weighings"],
    placeholder: "Select your answer...",
    options: ["1 weighing", "2 weighings", "3 weighings", "4 weighings"],
    explanation: "The minimum number of weighings is 2.\n\n**Step 1:** Divide the 9 balls into 3 groups of 3 (Groups A, B, and C).\nWeigh Group A against Group B. \n- If they balance, the heavy ball is in Group C. \n- If A is heavier, the ball is in A. If B is heavier, the ball is in B.\n\n**Step 2:** You now have 3 candidate balls. Choose 2 of them and weigh them against each other. \n- If they balance, the unweighed 3rd ball is the heavier one.\n- If they don't balance, the heavier side contains the ball."
  },
  {
    id: "three-switches",
    title: "Three Switches and Lightbulbs",
    category: "Logic",
    difficulty: "Medium",
    description: "You are standing outside a closed room. Inside the room, there are three incandescent lightbulbs. Outside the room, there are three standard switches, each controlling one of the bulbs. You cannot see into the room, and the door is closed. You can flip the switches as much as you want, but you can only enter the room ONCE. How do you determine which switch controls which lightbulb?",
    hints: [
      "Flipping switches turns bulbs on and off, but incandescent bulbs also generate something else when they are left on for a while.",
      "Think about heat! Bulbs get hot when they are on.",
      "Turn switch 1 on and leave it on for 5-10 minutes. Then turn it off and turn switch 2 on, and enter the room immediately."
    ],
    correctAnswers: ["heat", "hot", "temperature", "feel", "touch", "warm", "feel the bulb", "feel the lightbulb", "measure their heat / temperature"],
    placeholder: "Select your answer...",
    options: [
      "Measure their bulb color",
      "Measure their heat / temperature",
      "Check their shadows on the wall",
      "Use a laser pointer"
    ],
    explanation: "The key factor is **heat**.\n\n**Method:**\n1. Turn ON Switch 1 and leave it on for about 10 minutes.\n2. Turn Switch 1 OFF, and turn Switch 2 ON.\n3. Open the door and enter the room immediately:\n   - The bulb that is **ON** is controlled by **Switch 2**.\n   - The bulb that is **OFF but HOT/WARM** to the touch is controlled by **Switch 1**.\n   - The bulb that is **OFF and COLD** is controlled by **Switch 3**."
  },
  {
    id: "bridge-crossing",
    title: "Bridge Crossing in the Dark",
    category: "Riddles",
    difficulty: "Hard",
    description: "Four people (A, B, C, and D) need to cross a narrow, rickety bridge at night. The bridge can only support at most two people at a time. Because it is dark, they must carry a single flashlight to cross. The flashlight must be walked back and forth (it cannot be thrown). Each person walks at a different speed:\n- A takes 1 minute to cross.\n- B takes 2 minutes to cross.\n- C takes 5 minutes to cross.\n- D takes 10 minutes to cross.\n\nWhen two people cross together, they must walk at the slower person's pace. What is the minimum time (in minutes) required for all four to cross the bridge?",
    hints: [
      "If A carries the flashlight back every time, the total time will be: (1+10) + 1 + (1+5) + 1 + (1+2) = 19 minutes. Can we do better?",
      "To optimize, we want the two slowest people (C and D) to cross *together* so we only suffer the 10-minute penalty once.",
      "If C and D cross together, someone fast needs to be on the other side already to bring the flashlight back!"
    ],
    correctAnswers: ["17", "17 minutes", "seventeen", "17 min"],
    placeholder: "Select your answer...",
    options: ["15 minutes", "17 minutes", "19 minutes", "21 minutes"],
    explanation: "The minimum time is **17 minutes**.\n\nHere is the optimal sequence:\n1. **A and B cross** to the other side carrying the flashlight (takes 2 minutes). *Accumulated: 2 mins*\n2. **A returns** with the flashlight (takes 1 minute). *Accumulated: 3 mins*\n3. **C and D cross** together (takes 10 minutes). *Accumulated: 13 mins*\n4. **B returns** with the flashlight (takes 2 minutes). *Accumulated: 15 mins*\n5. **A and B cross** together again (takes 2 minutes). *Accumulated: 17 mins*\n\nBy having C and D cross together, we avoid A walking back with the flashlight and wasting time!"
  },
  {
    id: "burning-ropes",
    title: "Burning Ropes (45 Minutes)",
    category: "Riddles",
    difficulty: "Medium",
    description: "You have two ropes. Each rope takes exactly 60 minutes to burn completely from one end to the other. However, the ropes burn unevenly (e.g., half the rope might burn in 10 minutes, and the other half takes 50 minutes). You have a box of matches. How can you measure exactly 45 minutes using these two ropes?",
    hints: [
      "If you light a rope from *both* ends, it will burn completely in exactly 30 minutes, regardless of how unevenly it burns.",
      "You can start by lighting Rope 1 from both ends, and Rope 2 from only one end.",
      "At the 30-minute mark, Rope 1 is completely burned. Rope 2 has exactly 30 minutes of burn time remaining. What should you do to Rope 2?"
    ],
    correctAnswers: ["light both ends", "light rope 2", "burn both ends", "rope 2 from both ends", "Light Rope 1 at both ends, Rope 2 at one end; then at T=30 light other end of Rope 2"],
    placeholder: "Select your answer...",
    options: [
      "Light Rope 1 at one end, Rope 2 at both ends",
      "Light Rope 1 at both ends, Rope 2 at one end; then at T=30 light other end of Rope 2",
      "Fold both ropes in half and burn them together",
      "Light both ends of Rope 1 and Rope 2 simultaneously"
    ],
    explanation: "Here is how you measure exactly 45 minutes:\n\n1. **At T=0:** Light **Rope 1 from both ends**, and **Rope 2 from only one end**.\n2. **At T=30:** Rope 1 will be completely burned out. Rope 2 now has exactly 30 minutes of burning time left.\n3. **At T=30 (Action):** Immediately **light the other end of Rope 2** so it is now burning from both ends.\n4. **At T=45:** The remaining part of Rope 2 will burn out in exactly 15 minutes (30 mins / 2). The total elapsed time is 30 + 15 = 45 minutes!"
  },
  {
    id: "2-eggs-100-floors",
    title: "2 Eggs and 100 Floors",
    category: "Logic",
    difficulty: "Hard",
    description: "You are given 2 identical eggs and access to a 100-story building. You need to find the highest floor from which an egg can be dropped without breaking. If an egg drops and doesn't break, you can reuse it. If it breaks, it is gone. What is the minimum number of drops required in the worst-case scenario to find this floor?",
    hints: [
      "If you drop the first egg from floor 50, and it breaks, you must test floors 1 to 49 one by one with the second egg. In the worst case, that requires 50 drops.",
      "To minimize the worst case, we want the total potential drops (drops of Egg 1 + drops of Egg 2) to remain constant.",
      "Let the interval decrease by 1 for each drop of Egg 1. So if we start at floor X, the next floor is X + (X-1), then X + (X-1) + (X-2). Solve for X such that the sum is >= 100."
    ],
    correctAnswers: ["14", "14 drops", "fourteen"],
    placeholder: "Select your answer...",
    options: ["10 drops", "14 drops", "20 drops", "50 drops"],
    explanation: "The minimum number of drops in the worst-case is **14**.\n\n**Strategy:**\nWe start dropping the first egg from floor **14**.\n- If it breaks, we test floors 1 to 13 one by one (max 14 total drops).\n- If it doesn't break, we step up by **13 floors** to floor **27** (14 + 13).\n- If it breaks there, we test floors 15 to 26 one by one (max 14 total drops).\n- If it doesn't break, we step up by **12 floors** to floor **39** (27 + 12).\n\nWe decrease the step size by 1 each time: 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1. The sum of these integers from 1 to 14 is **105**, which covers all 100 floors! The worst case is always exactly 14 drops."
  },
  {
    id: "monty-hall",
    title: "The Monty Hall Problem",
    category: "Probability",
    difficulty: "Medium",
    description: "You are on a game show and given the choice of three doors. Behind one door is a car; behind the others, goats. You pick Door 1. The host (Monty Hall), who knows what's behind the doors, opens Door 3, which has a goat. He then asks: 'Do you want to switch to Door 2?' Is it mathematically advantageous to switch?",
    hints: [
      "When you originally choose, you have a 1/3 chance of picking the car and a 2/3 chance of picking a goat.",
      "Monty always reveals a goat from the remaining doors. He will never reveal the car.",
      "If you picked a goat originally (2/3 chance), switching will always lead you to the car!"
    ],
    correctAnswers: ["Yes, switching gives a 2/3 chance of winning", "yes", "2/3"],
    placeholder: "Select your answer...",
    options: [
      "Yes, switching gives a 2/3 chance of winning",
      "No, switching or staying both give a 1/2 chance",
      "No, staying gives a 2/3 chance of winning",
      "Yes, switching gives a 1/3 chance of winning"
    ],
    explanation: "Yes, it is highly advantageous to switch! Switching gives you a **2/3 chance** of winning.\n\n**Reasoning:**\n- There is a 1/3 chance your initial pick was correct (car). If you switch, you lose.\n- There is a 2/3 chance your initial pick was incorrect (goat). Since Monty is guaranteed to show the other goat, the remaining unpicked closed door *must* contain the car. If you switch, you win!\n- Therefore, switching converts a goat-pick into a car-pick, which happens 2/3 of the time."
  },
  {
    id: "poisoned-wine",
    title: "The Poisoned Wine Bottles",
    category: "Logic",
    difficulty: "Hard",
    description: "A king has 1000 bottles of wine. Exactly 1 bottle is poisoned and will kill a person in exactly 24 hours. The king has prisoner test subjects. What is the minimum number of prisoners needed to find the poisoned bottle within 24 hours?",
    hints: [
      "Think about binary representations! A single prisoner can be represented by 1 bit (live or die).",
      "With N prisoners, there are 2^N possible outcomes of who lives and who dies.",
      "We need 2^N to be at least 1000 to identify the unique poisoned bottle. Find the smallest N."
    ],
    correctAnswers: ["10", "10 prisoners", "ten"],
    placeholder: "Select your answer...",
    options: ["10 prisoners", "100 prisoners", "500 prisoners", "1000 prisoners"],
    explanation: "The minimum number of prisoners needed is **10**.\n\n**Logic:**\nWe can label the bottles from 1 to 1000 and write their numbers in **binary format** (which requires 10 bits since 2^10 = 1024 >= 1000).\n- Assign each prisoner to a specific bit position (1 to 10).\n- For each bottle, a prisoner drinks a drop of it if the binary representation of that bottle's number has a '1' at their assigned bit position.\n- After 24 hours, the binary combination of the deceased prisoners will point uniquely to the poisoned bottle (e.g., if prisoners 1, 3, and 5 die, bottle 2^0 + 2^2 + 2^4 = 21 is poisoned)."
  },
  {
    id: "mutilated-chessboard",
    title: "The Mutilated Chessboard",
    category: "Logic",
    difficulty: "Medium",
    description: "A standard 8x8 chessboard has two opposite corner squares removed (leaving 62 squares). You have 31 dominoes, each capable of covering exactly two adjacent squares. Can you tile the remaining board completely with the 31 dominoes?",
    hints: [
      "An 8x8 chessboard has 32 black and 32 white squares.",
      "What are the colors of opposite corner squares?",
      "Every domino must cover exactly one black square and one white square."
    ],
    correctAnswers: ["No, because opposite corners are of the same color, leaving unequal black/white squares", "no"],
    placeholder: "Select your answer...",
    options: [
      "Yes, easily",
      "No, because opposite corners are of the same color, leaving unequal black/white squares",
      "Yes, but only if we rotate the dominoes diagonally",
      "No, because 62 is not divisible by 31"
    ],
    explanation: "It is **impossible**.\n\n**Proof:**\n- A standard chessboard has 32 white and 32 black squares.\n- Opposite corner squares are **always the same color** (e.g., both black).\n- Removing two opposite corners leaves 32 white and 30 black squares (or vice versa).\n- Each domino covers exactly **1 black and 1 white square**.\n- 31 dominoes will always cover exactly 31 black and 31 white squares, which can never match the 32/30 division on the mutilated board."
  },
  {
    id: "fox-goose-beans",
    title: "Fox, Goose, and Bag of Beans",
    category: "Riddles",
    difficulty: "Easy",
    description: "A farmer wants to cross a river with a fox, a goose, and a bag of beans. His boat can only carry himself and one of the three. If left unattended: the fox will eat the goose, or the goose will eat the beans. How many river crossings are needed in total to get all three safely to the other side?",
    hints: [
      "First, take the goose across. Leave the fox and beans together (fox doesn't eat beans).",
      "Return alone. Next, take the fox across, but you cannot leave the fox and goose together on the other side!",
      "Bring the goose back with you, then take the beans across. Finally, return alone to get the goose."
    ],
    correctAnswers: ["7", "7 crossings", "seven"],
    placeholder: "Select your answer...",
    options: ["5 crossings", "7 crossings", "9 crossings", "11 crossings"],
    explanation: "The minimum number of crossings is **7**.\n\n**Sequence:**\n1. Take the **goose** across. (1)\n2. Return alone. (2)\n3. Take the **fox** across. (3)\n4. Return with the **goose**. (4)\n5. Take the **beans** across. (5)\n6. Return alone. (6)\n7. Take the **goose** across. (7)"
  },
  {
    id: "camel-banana",
    title: "The Camel and Banana Desert Puzzle",
    category: "Logic",
    difficulty: "Hard",
    description: "A desert owner has 3000 bananas and a camel. He wants to transport as many bananas as possible to a market 1000 miles away. The camel can carry a maximum of 1000 bananas at a time, but it consumes exactly 1 banana per mile traveled. What is the maximum number of bananas the owner can get to the market?",
    hints: [
      "If the camel goes all the way carrying 1000 bananas, it will consume all 1000 bananas on the way, leaving 0 at the market.",
      "The owner needs to establish intermediate banana 'depots' to drop bananas and return for more.",
      "To carry 3000 bananas, the camel must travel back and forth (5 trips total). Once bananas drop to 2000, we only need 3 trips. Once they drop to 1000, we only need 1 final trip."
    ],
    correctAnswers: ["533", "533 bananas"],
    placeholder: "Select your answer...",
    options: ["0 bananas", "533 bananas", "833 bananas", "1000 bananas"],
    explanation: "The maximum number of bananas is **533**.\n\n**Depot Strategy:**\n- **Phase 1:** Start with 3000 bananas. To move them, the camel makes 5 trips per mile (consume 5 bananas per mile). We travel **200 miles** until we have 2000 bananas left (3000 - 5 * 200 = 2000). Set up Depot 1 here at Mile 200.\n- **Phase 2:** From Depot 1, we have 2000 bananas. To move them, the camel makes 3 trips per mile (consume 3 bananas per mile). We travel **333.3 miles** further to Mile 533.3, where we have 1000 bananas left (2000 - 3 * 333.3 = 1000). Set up Depot 2 here.\n- **Phase 3:** We now have 1000 bananas and **466.7 miles** remaining (1000 - 533.3). The camel carries the 1000 bananas to the market in 1 single trip, consuming 467 bananas. \n- **Final count:** 1000 - 467 = **533 bananas** at the market."
  },
  {
    id: "rope-burning-15",
    title: "Rope Burning (15 Minutes)",
    category: "Riddles",
    difficulty: "Medium",
    description: "You have one rope that takes exactly 60 minutes to burn completely. It burns unevenly. How can you measure exactly 15 minutes?",
    hints: [
      "If you light both ends of a rope, it will burn out in exactly 30 minutes.",
      "What if you cut the rope or trigger another action exactly when they meet?",
      "When the two flames meet at T=30, the rope is in two burning pieces. If you light both ends of one half... wait, can we cut it?"
    ],
    correctAnswers: ["Light both ends of the rope, then cut it in half exactly when they meet", "cut in half"],
    placeholder: "Select your answer...",
    options: [
      "Light both ends of the rope",
      "Fold the rope in four parts and burn it",
      "You cannot measure 15 minutes with only one rope",
      "Light both ends of the rope, then cut it in half exactly when they meet"
    ],
    explanation: "Here is how you measure 15 minutes:\n1. Light **both ends of the rope simultaneously**. The rope will burn and the two flames will meet in exactly **30 minutes**.\n2. Exactly at the moment the flames meet (T=30), **cut the rope in half** or extinguish one of the burning halves.\n3. The remaining unburned segment has exactly 30 minutes of normal burn time left. Now, **light both ends of this segment**. It will burn out in exactly **15 minutes**!"
  },
  {
    id: "red-blue-cards",
    title: "The Red and Blue Cards Probability",
    category: "Probability",
    difficulty: "Easy",
    description: "You have 52 cards: 26 red and 26 blue. You shuffle them and split them into two equal piles of 26 cards. What is the probability that the number of red cards in Pile 1 is exactly equal to the number of blue cards in Pile 2?",
    hints: [
      "Let R1 be the number of red cards in Pile 1, and B1 be the number of blue cards in Pile 1.",
      "Since Pile 1 has 26 cards total, R1 + B1 = 26.",
      "Since there are 26 blue cards in total, the number of blue cards in Pile 2 is: B2 = 26 - B1. Compare B2 and R1!"
    ],
    correctAnswers: ["1.0", "1", "100%", "1.0 (100% probability)"],
    placeholder: "Select your answer...",
    options: ["0.25", "0.50", "1.0 (100% probability)", "0.33"],
    explanation: "The probability is **1.0 (100%)**!\n\n**Mathematical Proof:**\n- Let `R1` and `B1` be the number of red and blue cards in Pile 1. Since Pile 1 has 26 cards: `R1 + B1 = 26`.\n- Let `R2` and `B2` be the number of red and blue cards in Pile 2. Since Pile 2 has 26 cards: `R2 + B2 = 26`.\n- We also know there are 26 total blue cards: `B1 + B2 = 26`.\n- From `R1 + B1 = 26` we get `R1 = 26 - B1`.\n- From `B1 + B2 = 26` we get `B2 = 26 - B1`.\n- Therefore, `R1` is **always mathematically equal** to `B2`, regardless of how the cards are shuffled!"
  }
];

export function generateDynamicPuzzle(index: number, id: string): Puzzle {
  const pool = [
    {
      title: "The Gold Bar Cut Puzzle",
      category: "Logic" as const,
      difficulty: "Medium" as const,
      description: "You hire an employee for 7 days and agree to pay them 1/7th of a gold bar each day. You have a solid gold bar that is 7 units long. You are allowed to make only 2 cuts to the gold bar. How do you pay the employee daily?",
      hints: [
        "Think about binary or partitions of 1, 2, and 4 units.",
        "With 2 cuts, you can partition the bar into three pieces of sizes 1, 2, and 4.",
        "On day 1, give them the 1-unit piece. On day 2, give them the 2-unit piece and ask for the 1-unit piece back."
      ],
      correctAnswers: ["2 cuts", "2", "two cuts", "1, 2, and 4", "1 2 4"],
      placeholder: "Select your answer...",
      options: ["1 cut", "2 cuts", "3 cuts", "4 cuts"],
      explanation: "You make 2 cuts to partition the bar into pieces of sizes **1, 2, and 4 units**.\n\n- **Day 1:** Give them the 1-unit piece.\n- **Day 2:** Give them the 2-unit piece, take back the 1-unit piece.\n- **Day 3:** Give them the 1-unit piece again (they now have 1 + 2 = 3 units).\n- **Day 4:** Give them the 4-unit piece, take back the 1 and 2-unit pieces.\n- **Day 5:** Give them the 1-unit piece (they have 4 + 1 = 5 units).\n- **Day 6:** Give them the 2-unit piece, take back the 1-unit piece (they have 4 + 2 = 6 units).\n- **Day 7:** Give them the 1-unit piece (they have all 7 units)."
    },
    {
      title: "Coin Toss Game Theory",
      category: "Probability" as const,
      difficulty: "Easy" as const,
      description: "Alice and Bob play a game. They flip a fair coin repeatedly. Alice wins if she gets HEADS followed by HEADS (HH). Bob wins if he gets HEADS followed by TAILS (HT). What is the probability that Alice wins this game?",
      hints: [
        "The game starts with coin flips. If the first flip is tails, nothing changes.",
        "Think about who gets their pattern first once a HEAD is flipped.",
        "If a HEAD is flipped, Bob only needs a TAILS (HT) to win. If HEADS is flipped again, Alice wins (HH)."
      ],
      correctAnswers: ["0.25", "1/4", "25%", "0.25 (25% probability)"],
      placeholder: "Select your answer...",
      options: ["0.25 (25% probability)", "0.50 (50% probability)", "0.33 (33% probability)", "0.75 (75% probability)"],
      explanation: "Alice has a **1/4 (25%)** chance of winning.\n\n**Proof:**\n- Once a HEAD is flipped, if the next flip is T, Bob wins immediately. If the next flip is H, Alice wins immediately.\n- The only way Alice can win is if the first two non-T flips are HH. If HT occurs at any point, Bob wins since Bob's HT can appear in sequences like TH, TTH, but Alice's HH is harder to reach before HT because once you get H, a T ends the game for Bob, whereas Alice must get another H."
    },
    {
      title: "The Hourglass Timing Riddle",
      category: "Riddles" as const,
      difficulty: "Medium" as const,
      description: "You have two hourglasses: one measures exactly 7 minutes, and the other measures exactly 11 minutes. How can you measure exactly 15 minutes to boil a perfect egg?",
      hints: [
        "Start both hourglasses simultaneously.",
        "When the 7-minute hourglass runs out, 4 minutes remain in the 11-minute hourglass. Turn the 7-minute one over.",
        "Use the differences and reset the hourglasses to count exactly 15 minutes."
      ],
      correctAnswers: ["start both", "turn over", "flip"],
      placeholder: "Select your answer...",
      options: [
        "Flip the 11-minute hourglass twice and subtract 7",
        "Start both, at T=7 flip the 7-minute one; at T=11 flip it again",
        "Flip them sequentially",
        "Use a stopwatch instead"
      ],
      explanation: "Here is the exact method:\n1. **At T=0:** Start both hourglasses (7-min and 11-min) running.\n2. **At T=7:** The 7-min hourglass runs out. Immediately turn it over. The 11-min hourglass has exactly 4 minutes of sand left.\n3. **At T=11:** The 11-min hourglass runs out. The 7-min hourglass has been running for 4 minutes, so it has 3 minutes of sand left at the top. Flip the 11-min hourglass over immediately.\n4. **At T=14:** The 7-min hourglass runs out again. At this exact moment, 3 minutes have passed in the 11-min hourglass (leaving 8 minutes left). Turn the 11-min hourglass over. It will take exactly 3 minutes to run back! Total = 11 + 4 = 15 minutes."
    },
    {
      title: "The Wise Men and Hats",
      category: "Logic" as const,
      difficulty: "Hard" as const,
      description: "Three wise men are placed in a line, one behind the other. A hat is placed on each of their heads. The hats are chosen from a pool of 3 red hats and 2 black hats. The man in the back can see the hats of the two men in front of him. The man in the middle can see the hat of the man in front of him. The man in the front can see no one's hat. They are asked to guess their own hat color. After a silence, the man in the front correctly guesses his hat color. What color was it?",
      hints: [
        "If the man in the back saw two black hats, he would know his own hat is red immediately. His silence means he did not see two black hats.",
        "The middle man realizes this. If he saw a black hat in front, he would know his own is red. His silence tells the front man his hat is not black.",
        "The front man deduces his hat must be red."
      ],
      correctAnswers: ["red", "red hat"],
      placeholder: "Select your answer...",
      options: ["Red", "Black", "Cannot be determined", "Blue"],
      explanation: "The front man's hat is **Red**.\n\n**Reasoning:**\n- If the front two hats were both **Black**, the man in the back would know his hat is **Red** (since there are only 2 black hats total). His silence tells the middle man that at least one of the front two hats is **Red**.\n- Knowing this, the middle man looks at the front man. If the front man's hat were **Black**, the middle man would know his own hat is **Red**. Since the middle man is silent, the front man deduces that his own hat cannot be **Black**. Thus, it must be **Red**."
    }
  ];

  const template = pool[index % pool.length];
  return {
    ...template,
    id,
    title: `${template.title} #${index + 1}`
  };
}
