import QUESTIONS from './financial-quiz-data.json' with {type:'json'};
export function publicQuestion(id){const q=QUESTIONS[id];return q?{id,question:q.question,options:[...q.options]}:null;}
export function gradeQuestion(id,choice){const q=QUESTIONS[id];if(!q)throw Error('Pergunta oficial não encontrada');if(!['A','B','C','D'].includes(choice))throw Error('Alternativa inválida');return {correct:q.correct===choice,answer:q.correct,choice};}
export function validateQuizCatalog(){return Object.keys(QUESTIONS).length===30&&Object.values(QUESTIONS).every(q=>q.options.length===4&&'ABCD'.includes(q.correct));}
