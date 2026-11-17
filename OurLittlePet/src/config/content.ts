/**
 * ✏️ PERSONAL CONTENT — edit freely, no UI code changes needed.
 * Everything here is plain text. Keep "Baby" or change the nickname below.
 */
export const NICKNAME = 'Baby';

export const REMINDER_CATEGORIES: { id: string; label: string; emoji: string; messages: string[] }[] = [
  { id: 'love', label: 'A reason I love you', emoji: '💗', messages: [
    `${NICKNAME}, I love how you make ordinary days feel like little adventures.`,
    `${NICKNAME}, I love the way you laugh with your whole heart.`,
    `${NICKNAME}, I love how kind you are, even when no one is watching.`,
  ] },
  { id: 'special', label: 'You are special', emoji: '✨', messages: [
    `A little reminder, ${NICKNAME}: you are more special than you know.`,
    `You are enough, ${NICKNAME}. Exactly as you are.`,
    `${NICKNAME}, the world is softer because you are in it.`,
  ] },
  { id: 'missme', label: 'When you miss me', emoji: '🫶', messages: [
    `Miss me? Close your eyes, ${NICKNAME}. I'm thinking about you right now.`,
    `Distance is just a number. My heart is right there with you, ${NICKNAME}.`,
    `Send me a message, ${NICKNAME}. I will always make time for you.`,
  ] },
  { id: 'memory', label: 'A favorite memory', emoji: '📸', messages: [
    `Remember our first time laughing until we couldn't breathe, ${NICKNAME}? Best day.`,
    `I still smile thinking about our little moments together, ${NICKNAME}.`,
  ] },
  { id: 'compliment', label: 'A compliment', emoji: '🌸', messages: [
    `You are beautiful inside and out, ${NICKNAME}.`,
    `${NICKNAME}, your smile could fix my worst day.`,
    `You are so smart and so brave, ${NICKNAME}.`,
  ] },
  { id: 'surprise', label: 'Surprise me', emoji: '🎁', messages: [
    `Surprise! Virtual hug incoming, ${NICKNAME}. 🤗`,
    `Plot twist: I love you more than yesterday, ${NICKNAME}.`,
    `Go drink some water and then come tell me about your day, ${NICKNAME}. 💧`,
  ] },
];

export const LOVE_LETTER = {
  title: `To my ${NICKNAME}`,
  paragraphs: [
    `${NICKNAME}, if you're reading this, it means we built something together, one little cat snack at a time.`,
    `I made this little world so we would always have a soft place to meet, no matter how far apart we are.`,
    `Thank you for every message, every silly game, every moment you chose me. You are my favorite person.`,
    `Whatever comes next, I'll be right here, feeding the cat and loving you.`,
  ],
  signoff: 'Forever yours 💗',
};
