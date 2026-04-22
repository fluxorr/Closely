export type Category = 'deep' | 'fun' | 'memory' | 'game' | 'action' | 'spicy' | 'naughty';

export interface CardInfo {
  id: string;
  category: Category;
  text: string;
}

export const CARDS: CardInfo[] = [
  // existing
  { id: '1', category: 'deep', text: 'What is a moment where you felt most loved by me?' },
  { id: '2', category: 'fun', text: 'If we could teleport anywhere for dinner tonight, where to?' },
  { id: '3', category: 'game', text: 'Staring contest. First to blink has to buy the next coffee!' },
  { id: '4', category: 'spicy', text: 'What is your favorite memory of us in the bedroom?' },
  { id: '5', category: 'memory', text: 'What was your first impression of me?' },
  { id: '6', category: 'action', text: 'Send me a funny selfie right now.' },

  // new additions
  { id: '7', category: 'deep', text: 'What is a dream you have that you have never spoken out loud?' },
  { id: '8', category: 'fun', text: 'If we were in a zombie apocalypse, what would be your survival role vs my survival role?' },
  { id: '9', category: 'game', text: 'Thumb war! Loser gives a 5-minute massage.' },
  { id: '10', category: 'action', text: 'Kiss my forehead right now.' },
  { id: '11', category: 'memory', text: 'Describe exactly what I was wearing on our first date.' },
  { id: '12', category: 'spicy', text: 'What is a secret fantasy you have been too shy to share?' },
  { id: '13', category: 'naughty', text: 'Whisper something indecent in my ear.' },
  { id: '14', category: 'spicy', text: 'If you could have your way with me right now, what would you do?' },
  { id: '15', category: 'deep', text: 'When did you first realize you were falling for me?' },
  { id: '16', category: 'action', text: 'Stare deeply into each others eyes for exactly 1 minute.' },
  { id: '17', category: 'game', text: 'Rock, paper, scissors. Best 2 out of 3.' },
  { id: '18', category: 'memory', text: 'What is your favorite trip we’ve ever taken together?' },
  { id: '19', category: 'fun', text: 'Which movie accurately describes our relationship?' },
  { id: '20', category: 'deep', text: 'What is a fear you have right now about the future?' },
  { id: '21', category: 'naughty', text: 'Where is the riskiest place you have ever wanted to do it?' },
  { id: '22', category: 'game', text: 'Try not to laugh while I spend 30 seconds doing everything to make you crack.' },
  { id: '23', category: 'fun', text: 'If you had to describe my personality in 3 adjectives, what are they?' },
  { id: '24', category: 'memory', text: 'What’s a small, random thing I did that stuck with you for a long time?' },
  { id: '25', category: 'action', text: 'Give me your best pick-up line. You have 10 seconds to prepare.' },
  { id: '26', category: 'naughty', text: 'What article of my clothing drives you the craziest?' },
  { id: '27', category: 'deep', text: 'In what ways do you think we make each other better?' },
  { id: '28', category: 'fun', text: 'If we could only eat one meal together for the rest of our lives, what is it?' },
  { id: '29', category: 'game', text: 'Arm wrestle. Loser makes the bed tomorrow.' },
  { id: '30', category: 'spicy', text: 'What is your absolute favorite spot to be kissed?' },
  // new cards (31–65)

  { id: '31', category: 'deep', text: 'What is something you wish I understood about you without you having to explain it?' },
  { id: '32', category: 'deep', text: 'Do you think long distance has made us stronger or just harder? Why?' },
  { id: '33', category: 'deep', text: 'What is one thing you are afraid to lose about us?' },
  { id: '34', category: 'deep', text: 'When do you feel closest to me, even when we are far apart?' },
  { id: '35', category: 'deep', text: 'What is something you have been overthinking about us lately?' },

  { id: '36', category: 'fun', text: 'If we switched lives for a day, what is the first thing you would do as me?' },
  { id: '37', category: 'fun', text: 'What is the dumbest argument we have ever had?' },
  { id: '38', category: 'fun', text: 'If I was a video game character, what would my special ability be?' },
  { id: '39', category: 'fun', text: 'If we had a couple nickname that was embarrassing, what would it be?' },
  { id: '40', category: 'fun', text: 'What is something weird about me that you secretly love?' },

  { id: '41', category: 'game', text: 'Guess what I am thinking right now. You get 3 tries.' },
  { id: '42', category: 'game', text: 'Say a word at the same time in 3…2…1. Try to match.' },
  { id: '43', category: 'game', text: 'Describe me in one word. I will do the same. Compare.' },
  { id: '44', category: 'game', text: 'First one to smile loses. Go.' },
  { id: '45', category: 'game', text: 'We both type a number from 1–10. If it matches, we win.' },

  { id: '46', category: 'memory', text: 'What is a random moment with me that still makes you smile?' },
  { id: '47', category: 'memory', text: 'When did I surprise you the most?' },
  { id: '48', category: 'memory', text: 'What is one small habit of mine you miss daily?' },
  { id: '49', category: 'memory', text: 'What was a moment where you felt I really understood you?' },
  { id: '50', category: 'memory', text: 'What is a memory with me that feels unreal now?' },

  { id: '51', category: 'action', text: 'Send me a voice note describing how you would hug me right now.' },
  { id: '52', category: 'action', text: 'Close your eyes for 10 seconds and imagine me. Then tell me what you saw.' },
  { id: '53', category: 'action', text: 'Send me the last picture in your gallery without explaining it.' },
  { id: '54', category: 'action', text: 'Text me something you have never said before.' },
  { id: '55', category: 'action', text: 'Set a reminder for our next call and tell me what you are most excited for.' },

  { id: '56', category: 'spicy', text: 'What is something I do that instantly gets your attention?' },
  { id: '57', category: 'spicy', text: 'What do you think I look best in (or without)?' },
  { id: '58', category: 'spicy', text: 'What is one thing you want to do the next time we meet?' },
  { id: '59', category: 'spicy', text: 'What is something you have imagined about us that you have not told me?' },
  { id: '60', category: 'spicy', text: 'What kind of kiss do you miss the most from me?' },

  { id: '61', category: 'naughty', text: 'If I was right in front of you right now, what is the first thing you would do?' },
  { id: '62', category: 'naughty', text: 'Describe how you would distract me if I was trying to focus.' },
  { id: '63', category: 'naughty', text: 'What is something you would whisper to me if no one could hear?' },
  { id: '64', category: 'naughty', text: 'What is your favorite way to tease me?' },
  { id: '65', category: 'naughty', text: 'What is something you want me to do more often?' },
];
