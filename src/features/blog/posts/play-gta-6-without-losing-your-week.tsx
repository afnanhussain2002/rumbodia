import { B, Example, Ext, H2, H3, In, OL, P, UL } from "@/features/blog/components/prose";
import { SOURCES } from "@/features/blog/sources";
import type { Post } from "@/features/blog/types";

function Body() {
  return (
    <>
      <P>
        <em>Grand Theft Auto VI</em> <Ext href={SOURCES.gta6Launch}>came out on Thursday, November 19</Ext>, after a 13-year wait, and a lot of people are
        about to lose a lot of hours to Vice City.
      </P>
      <P>
        That&rsquo;s fine. It&rsquo;s a game, and you waited for it. But there&rsquo;s a way to play a huge game that leaves you happy at the end of the
        week, and a way that leaves you tired, behind on work and wondering where Tuesday went. The difference is rarely the game. It&rsquo;s whether you
        decided anything before you started.
      </P>
      <P>Here&rsquo;s a simple plan. It takes about five minutes to set up.</P>

      <H2 id="why-big-games-eat-weeks">Why big games eat whole weeks</H2>
      <P>
        Open-world games are built so there&rsquo;s always one more thing to do: one more mission, one more drive, one more side street. There&rsquo;s no
        natural stopping point. Each small choice feels harmless, and then it&rsquo;s 3 a.m.
      </P>
      <P>
        The hours aren&rsquo;t the real problem, though. The problem is that you don&rsquo;t notice what they replace. Sleep goes first, then exercise, then
        the thing you meant to finish. A week later you can&rsquo;t say exactly what slipped, only that you feel behind.
      </P>

      <H2 id="how-to-balance-gaming-and-work">How to balance gaming and work in 5 steps</H2>

      <H3 id="protect-two-goals">Step 1: Pick two things you won&rsquo;t trade away</H3>
      <P>Before you play, choose two goals that stay protected no matter how good the game is. Make them specific:</P>
      <UL>
        <li>
          <B>Sleep:</B> in bed by a set time on weeknights
        </li>
        <li>
          <B>Work or study:</B> the one task that has to be done each day
        </li>
        <li>
          <B>Movement:</B> a walk or workout, three or four times this week
        </li>
        <li>
          <B>People:</B> one real conversation or meal a day
        </li>
      </UL>
      <P>Two is enough. If you protect ten things, you&rsquo;ll protect none.</P>

      <H3 id="set-a-cap">Step 2: Set a cap, and put it where you&rsquo;ll see it</H3>
      <P>
        Decide how many hours you&rsquo;ll play on a weekday and on a weekend day. For example, two hours on weekdays and five on days off. Pick numbers you
        can keep, not numbers that sound responsible.
      </P>
      <P>
        Then make the cap visible: a phone timer, a note stuck to the TV, or a rule that you stop at the next save point after your time is up.
      </P>

      <H3 id="play-first-or-work-first">Step 3: Play first or work first? Decide once</H3>
      <P>
        Most people lose this fight in the moment. Decide the order ahead of time, so you aren&rsquo;t negotiating at 6 p.m. with a controller in your
        hand.
      </P>
      <P>
        A common rule: do the one task that matters, then play. It works because the game becomes a reward you&rsquo;ve already earned, not a way to avoid
        something.
      </P>

      <H3 id="score-each-day">Step 4: Score each day in two minutes</H3>
      <P>
        This is the step that tells you whether the plan is working. At the end of each day, write a short list of what happened, including the hours you
        played:
      </P>
      <Example>1. Played 3 hours 2. Finished the report 3. Skipped the walk 4. In bed at 12:15</Example>
      <P>
        Then give the day a score from −10 to +10 for how much it moved you toward your goals. A day with a lot of play and your two protected goals met
        might be a +5. A day where the game pushed out sleep and work might be a −4. Both are fine to record.
      </P>
      <P>
        The point isn&rsquo;t to feel guilty. It&rsquo;s to see the pattern. Research backs up the habit: a <Ext href={SOURCES.apa}>review of 138 studies</Ext>{" "}
        with 19,951 participants found that people who monitored their progress were more likely to reach their goals, and that writing progress down made
        the effect stronger.
      </P>

      <H3 id="check-the-trend">Step 5: Check the trend after a week</H3>
      <P>After seven days, look at your scores side by side:</P>
      <UL>
        <li>What was your average on heavy-play days compared with light-play days?</li>
        <li>Which protected goal slipped first?</li>
        <li>Is the cap holding, or did you quietly raise it?</li>
      </UL>
      <P>
        If your average stayed above zero and both goals held, the plan works. Keep it. If a goal slipped, tighten the cap or move your play time later in
        the evening, and run another week.
      </P>

      <H2 id="warning-signs">Warning signs worth taking seriously</H2>
      <P>
        Occasional late nights after a big release are normal. But if you keep playing longer than you meant to, hide how much you play, or notice it
        hurting your sleep, work or relationships week after week, talk to someone you trust. A doctor or counselor can help if gaming has stopped being
        fun.
      </P>

      <H2 id="tracking-with-rumbodia">Tracking it with Rumbodia</H2>
      <P>
        <In href="/">Rumbodia</In> does steps 4 and 5 for you. Add your protected goals once, write a short update each day, and AI scores it against those
        goals. A calendar of faces and a trend chart show how your week went, so you don&rsquo;t have to add anything up. It starts with a 7-day free
        trial.
      </P>
      <P>
        Related: <In href="/blog/how-to-know-if-your-days-are-improving">How to know if your days are actually improving</In> ·{" "}
        <In href="/blog/track-daily-progress-against-goals">How to track daily progress against your goals</In> ·{" "}
        <In href="/blog/why-journaling-fails">Why journaling fails (and what works instead)</In>
      </P>
    </>
  );
}

export const post: Post = {
  slug: "play-gta-6-without-losing-your-week",
  title: "How to Play GTA 6 Without Losing Your Week",
  h1: "How to Play GTA 6 Without Losing Your Week",
  description:
    "A simple plan to enjoy GTA 6 without wrecking your sleep, work or goals: a daily cap, two protected goals and a 2-minute score.",
  keyword: "balance gaming and work",
  published: "2026-11-20",
  mood: "rising",
  readMinutes: 5,
  bannerAlt:
    "Two example days side by side. With no plan: played 7 hours, skipped the gym, missed the deadline, scored −7 Falling. With a plan: played 2 hours, finished the report, walked 20 minutes, scored +5 Rising.",
  faq: [
    {
      q: "How many hours of gaming a day is too much?",
      a: "There's no number that fits everyone. A better test is whether your sleep, work and relationships are holding up. If they are, your hours are fine for you.",
    },
    {
      q: "Should I take time off work for a big release?",
      a: "If you can, it's the cleanest option. If you can't, protect your sleep and play after your main task is done.",
    },
    {
      q: "What if I break my cap one night?",
      a: "Log it, score the day honestly and go back to the plan the next day. One bad night is a data point.",
    },
  ],
  Body,
};
