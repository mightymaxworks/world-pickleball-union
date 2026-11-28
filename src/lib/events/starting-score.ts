export const pairLabels={women:"Women’s pair",men:"Men’s pair",mixed:"Mixed pair"} as const;
export type PairKind=keyof typeof pairLabels;
export const openDoublesMatchups=[
  {id:"womenMen",first:"women",second:"men"},
  {id:"womenMixed",first:"women",second:"mixed"},
  {id:"menMixed",first:"men",second:"mixed"},
] as const;
export type OpenDoublesMatchup=(typeof openDoublesMatchups)[number];
export type StartingScoreRule={ahead:PairKind|"none";points:number|null};
export type StartingScorePlan={
  gameTo:number|null;
  matchups:Record<OpenDoublesMatchup["id"],StartingScoreRule>;
};

export function evenStartingScores():StartingScorePlan {
  return {gameTo:11,matchups:{
    womenMen:{ahead:"none",points:0},
    womenMixed:{ahead:"none",points:0},
    menMixed:{ahead:"none",points:0},
  }};
}

const isPositiveInteger=(value:unknown):value is number=>typeof value==="number" && Number.isSafeInteger(value) && value>0;
const isGameTarget=(value:unknown):value is number=>isPositiveInteger(value) && value>=2;
const hasKeys=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>
  !!value && typeof value==="object" && !Array.isArray(value) && Object.keys(value).length===keys.length &&
  keys.every(k=>Object.hasOwn(value,k));

export function parseStartingScores(input:unknown):StartingScorePlan|null {
  if (!hasKeys(input,["gameTo","matchups"]) || (input.gameTo!==null&&!isPositiveInteger(input.gameTo)) ||
      !hasKeys(input.matchups,openDoublesMatchups.map(row=>row.id))) return null;
  const matchups=evenStartingScores().matchups;
  for (const {id,first,second} of openDoublesMatchups) {
    const row=input.matchups[id];
    if (!hasKeys(row,["ahead","points"])) return null;
    const {ahead,points}=row;
    if (ahead==="none") { if (points!==0) return null; }
    else if ((ahead!==first && ahead!==second) || (points!==null&&!isPositiveInteger(points))) return null;
    matchups[id]={ahead,points} as StartingScoreRule;
  }
  return {gameTo:input.gameTo,matchups};
}

export function usesStartingHandicap(plan?:StartingScorePlan) {
  // A configured head start with a missing value is still an attempted handicap.
  return !!plan && openDoublesMatchups.some(({id})=>plan.matchups[id].ahead!=="none");
}

export function startingScoreIssues(plan:StartingScorePlan):string[] {
  const issues:string[]=[];
  if (!isGameTarget(plan.gameTo)) issues.push("enter a game target of at least 2 points.");
  for (const {id,first,second} of openDoublesMatchups) {
    const {ahead,points}=plan.matchups[id];
    if (ahead==="none") continue;
    const matchup=pairLabels[first]+" vs "+pairLabels[second];
    if (!isPositiveInteger(points)) issues.push("enter the starting points for "+matchup+".");
    else if (isGameTarget(plan.gameTo) && points>=plan.gameTo) issues.push(matchup+" must start below the game target.");
  }
  return issues;
}

/** Resolve a per-game start in the scorecard's actual left/right order.
 * A null result means the relevant rule is incomplete or invalid.
 */
export function startingScoreFor(plan:StartingScorePlan|undefined,left:PairKind,right:PairKind):[number,number]|null {
  if (!plan || left===right) return [0,0];
  const matchup=openDoublesMatchups.find(({first,second})=>(left===first&&right===second)||(right===first&&left===second));
  if (!matchup) return null;
  const {ahead,points}=plan.matchups[matchup.id];
  if (ahead==="none") return [0,0];
  if ((ahead!==left&&ahead!==right) || !isPositiveInteger(points) || !isGameTarget(plan.gameTo) || points>=plan.gameTo) return null;
  return ahead===left?[points,0]:[0,points];
}
