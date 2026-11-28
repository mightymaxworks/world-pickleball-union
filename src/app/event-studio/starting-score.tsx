import {
  evenStartingScores, openDoublesMatchups, pairLabels, startingScoreFor, type PairKind, type StartingScorePlan,
} from "@/lib/events/starting-score";

const positiveOrBlank=(input:HTMLInputElement)=>{
  const n=input.valueAsNumber;
  return Number.isSafeInteger(n)&&n>=1 ? n : null;
};

export function StartingScoreSettings({plan,change}:{
  plan:StartingScorePlan|undefined;change:(plan:StartingScorePlan|undefined)=>void;
}) {
  return <fieldset className="es-starting-score">
    <legend>Starting scores</legend>
    <label className="es-starting-toggle"><input type="checkbox" checked={!!plan} onChange={e=>change(e.target.checked?evenStartingScores():undefined)}/>
      Use starting-score handicaps</label>
    {!plan ? <p className="es-comp-help">Off. Every matchup starts at 0–0.</p> : <>
      <p className="es-comp-help">Set each matchup independently. The same starting score applies in every game. Pairs of the same type always start at 0–0.</p>
      <label className="es-game-target">Game target (points)<input type="number" min={2} step={1} inputMode="numeric" value={plan.gameTo??""}
        onChange={e=>change({...plan,gameTo:positiveOrBlank(e.currentTarget)})}/></label>
      <div className="es-starting-rows">
        {openDoublesMatchups.map(({id,first,second})=>{
          const rule=plan.matchups[id], title=pairLabels[first]+" vs "+pairLabels[second];
          return <fieldset key={id} className="es-starting-row">
            <legend>{title}</legend>
            <label>Who starts ahead?<select aria-label={title+" — who starts ahead?"} value={rule.ahead} onChange={e=>{
              const ahead=e.target.value as PairKind|"none";
              change({...plan,matchups:{...plan.matchups,[id]:{ahead,points:ahead==="none"?0:rule.ahead==="none"?null:rule.points}}});
            }}>
              <option value="none">Neither · 0–0</option>
              <option value={first}>{pairLabels[first]}</option><option value={second}>{pairLabels[second]}</option>
            </select></label>
            <label>Starting points<input type="number" min={1} max={plan.gameTo&&plan.gameTo>=2?plan.gameTo-1:undefined} step={1}
              inputMode="numeric" disabled={rule.ahead==="none"} aria-label={title+" — starting points"} value={rule.points??""}
              onChange={e=>change({...plan,matchups:{...plan.matchups,[id]:{...rule,points:positiveOrBlank(e.currentTarget)}}})}/></label>
          </fieldset>;
        })}
      </div>
      <p className="es-comp-help">A division that uses a head start is participation-only. Starting points do not earn WPU ranking points.</p>
    </>}
  </fieldset>;
}

export function StartingScoreSummary({plan}:{plan?:StartingScorePlan}) {
  if (!plan) return <p>Every matchup starts at 0–0.</p>;
  return <div className="es-starting-summary">
    <strong>Starting score for every game</strong>
    {plan.gameTo!==null && <p>Games to {plan.gameTo}.</p>}
    <dl>{openDoublesMatchups.map(({id,first,second})=>{
      const score=startingScoreFor(plan,first,second);
      return <div key={id}><dt>{pairLabels[first]} vs {pairLabels[second]}</dt><dd>{score?score.join("–"):"Not set"}</dd></div>;
    })}</dl>
    <p>Pairs of the same type start at 0–0.</p>
  </div>;
}
