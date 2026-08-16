export function evaluateRegression(testCase, result) {
  const combined = JSON.stringify(result);
  const acceptedDecision = JSON.stringify({
    framework: result.framework,
    emotionReward: result.emotionReward,
    coreHook: result.coreHook,
    mainline: result.mainline,
    gameplayBundles: result.gameplayBundles,
    creativeTreatment: result.creativeTreatment,
    functionReplacement: result.functionReplacement,
  });
  const required = testCase.required.map((term) => ({ term, pass: combined.includes(term) }));
  const forbidden = testCase.forbidden.map((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rejectedMention = new RegExp(`(?:不(?:是|采用|使用|靠|加|写|要|应|得)?|拒绝|避免|不得|没有)[^，。；]{0,12}${escaped}`, "g");
    const affirmativeDecision = acceptedDecision.replace(rejectedMention, "");
    return { term, pass: !affirmativeDecision.includes(term) };
  });
  return {
    pass: [...required, ...forbidden].every((item) => item.pass),
    required,
    forbidden,
  };
}
