function sameArray(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false
  return [...left].sort().join('|') === [...right].sort().join('|')
}

function isCorrect(question, answer) {
  const responseType = question.responseType || question.type
  if (responseType === 'multiple') return sameArray(answer, question.answer)
  if (responseType === 'numeric') {
    const numeric = Number(answer)
    return Number.isFinite(numeric) && Math.abs(numeric - question.answer) <= (question.tolerance ?? 0.01)
  }
  return answer === question.answer
}

export function scoreAttempt(questions = [], answers = {}) {
  const details = questions.map(question => {
    const correct = isCorrect(question, answers[question.id])
    return {
      id: question.id, dimension: question.dimension, points: question.points,
      earned: correct ? question.points : 0, correct,
      submitted: answers[question.id] ?? null, answer: question.answer,
      explanation: question.explanation, commonError: question.commonError,
      chapter: question.chapter, returnTo: question.returnTo,
    }
  })
  const dimensions = [...new Set(questions.map(question => question.dimension))].map(dimension => {
    const items = details.filter(item => item.dimension === dimension)
    return {
      dimension,
      score: items.reduce((sum, item) => sum + item.earned, 0),
      total: items.reduce((sum, item) => sum + item.points, 0),
      errors: items.filter(item => !item.correct).length,
    }
  })
  return {
    score: details.reduce((sum, item) => sum + item.earned, 0),
    total: details.reduce((sum, item) => sum + item.points, 0),
    details,
    dimensions,
    errorTypes: dimensions.filter(item => item.errors).sort((a, b) => b.errors - a.errors).map(item => item.dimension),
  }
}
