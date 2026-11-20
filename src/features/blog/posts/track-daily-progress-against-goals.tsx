import { B, Example, Ext, H2, In, P, Table, UL } from "@/features/blog/components/prose";
import { SOURCES } from "@/features/blog/sources";
import type { Post } from "@/features/blog/types";

function Body() {
  return (
    <>
      <P>
        Setting goals is the easy part. The hard part comes in week three, when you can&rsquo;t say whether you&rsquo;re on track because you never wrote
        anything down. This guide shows how to track daily progress toward your goals in about two minutes a day: what to record, how to score it, and how
        to review it so the record tells you something.
      </P>

      <H2 id="why-daily-tracking-works">Why daily tracking works</H2>
      <P>
        A 2016 meta-analysis in <em>Psychological Bulletin</em> pooled 138 experiments with 19,951 participants. People who were prompted to monitor their
        progress were more likely to reach their goals, and the more often they checked, the better they did. Writing progress down or sharing it made the
        effect stronger (<Ext href={SOURCES.apa}>APA summary</Ext>; <Ext href={SOURCES.harkinPaper}>paper</Ext>).
      </P>
      <P>
        The lead author, Benjamin Harkin, also pointed out that what you track should match the goal. If the goal is to change your diet, track what you
        eat. If it&rsquo;s to lose weight, track your weight (<Ext href={SOURCES.eurekalert}>EurekAlert</Ext>).
      </P>

      <H2 id="step-1">Step 1: Turn each goal into something you can record</H2>
      <P>Vague goals can&rsquo;t be tracked. Rewrite each one so a day either moved it or didn&rsquo;t.</P>
      <Table
        head={["Goal", "What to record each day", "Weekly target"]}
        rows={[
          ["Get fitter", "Workout done? Distance or minutes", "4 workouts"],
          ["Grow my side project", "Customers talked to, features shipped", "2 customer calls"],
          ["Sleep better", "Time in bed", "5 nights before 11 pm"],
          ["Read more", "Pages read", "100 pages"],
          ["Spend less", "Money spent outside essentials", "Under a set amount"],
        ]}
      />
      <P>Keep it to 3 to 5 goals. With ten, the daily log turns into homework and you&rsquo;ll stop.</P>

      <H2 id="step-2">Step 2: Log the day in two minutes</H2>
      <P>At the end of the day, or right after something worth noting, write a short numbered list of what you did. Use facts, not judgments:</P>
      <Example>1. Ran 1 km 2. Talked to 2 customers 3. Got 0 new sign-ups 4. In bed at 12:30</Example>
      <P>Then add one thing that lifted your energy and one that drained it. That&rsquo;s the whole entry.</P>

      <H2 id="step-3">Step 3: Score the day against your goals</H2>
      <P>Give the day one number from −10 to +10:</P>
      <UL>
        <li>
          <B>+7 to +10:</B> moved several goals forward
        </li>
        <li>
          <B>+3 to +6:</B> clear progress on at least one goal
        </li>
        <li>
          <B>−2 to +2:</B> a flat day, nothing moved much
        </li>
        <li>
          <B>−3 to −6:</B> worked against a goal or two
        </li>
        <li>
          <B>−7 to −10:</B> a day that pulled you away from most of them
        </li>
      </UL>
      <P>
        The number lets you compare days, which a checklist can&rsquo;t do. A checklist says you did or didn&rsquo;t run. A score says the run happened on a
        day you also skipped the work that mattered most.
      </P>

      <H2 id="step-4">Step 4: Review weekly, adjust monthly</H2>
      <P>Once a week, spend five minutes on:</P>
      <UL>
        <li>your average score compared with last week</li>
        <li>each goal against its weekly target (2 of 4 workouts, 1 of 2 calls)</li>
        <li>the drain that showed up most</li>
      </UL>
      <P>
        Once a month, look at the trend and change one thing: drop a goal you keep ignoring, raise a target you hit every week, or fix the drain that keeps
        coming back.
      </P>

      <H2 id="which-tool">Which tool to use</H2>
      <Table
        head={["Method", "Good for", "Weak spot"]}
        rows={[
          ["Paper notebook", "No setup, no screen", "Hard to add up or chart"],
          ["Spreadsheet", "Number goals, custom charts", "Easy to stop opening"],
          ["Habit tracker app", "Yes/no daily habits", "Misses work that isn't a checkbox"],
          ["Daily log with a score", "Mixed goals, seeing the overall direction", "Needs a few honest lines each day"],
        ]}
      />
      <P>Pick the one you&rsquo;ll actually open every day. A simple method you keep beats a perfect one you drop.</P>

      <H2 id="common-mistakes">Common mistakes</H2>
      <UL>
        <li>
          <B>Tracking too much.</B> More than 5 goals and the log becomes a chore.
        </li>
        <li>
          <B>Only tracking yes/no habits.</B> A lot of real progress (a hard conversation, a shipped feature) doesn&rsquo;t fit in a checkbox.
        </li>
        <li>
          <B>Never reviewing.</B> Data you don&rsquo;t look at doesn&rsquo;t change anything.
        </li>
        <li>
          <B>Changing goals every week.</B> You need at least a month of the same goals to see a trend.
        </li>
        <li>
          <B>Treating a bad day as failure.</B> One −5 is a data point. Five in a row is a pattern worth looking at.
        </li>
      </UL>

      <H2 id="how-rumbodia-does-it">How Rumbodia does it</H2>
      <P>
        <In href="/">Rumbodia</In> runs this whole method for you. Add up to 10 goals with optional targets like &ldquo;4×/week&rdquo;, write short updates
        during the day, and AI scores each one against those goals. The Stats page shows your streak, momentum, which tags help or hurt, and how mornings
        compare with nights. Try it free for 7 days.
      </P>
    </>
  );
}

export const post: Post = {
  slug: "track-daily-progress-against-goals",
  title: "How to Track Daily Progress Against Your Goals",
  h1: "How to Track Daily Progress Against Your Goals",
  description:
    "Tracking progress makes you more likely to reach a goal. A 2-minute daily method, what to record, and how to read the trend.",
  keyword: "how to track daily progress toward goals",
  published: "2026-11-18",
  mood: "soaring",
  readMinutes: 6,
  bannerAlt:
    "A weekly goals card with progress bars for running, customer calls, sleep and reading, a −10 to +10 score scale marked at +7, and the line: log daily, review weekly.",
  faq: [
    {
      q: "How many goals should I track at once?",
      a: "Three to five. Fewer is fine. More usually means you stop logging.",
    },
    {
      q: "Should I track daily or weekly?",
      a: "Log daily, review weekly. The meta-analysis above found that more frequent monitoring led to better results.",
    },
    {
      q: "What if I miss a day?",
      a: "Log a one-line entry the next day and keep going. Don't try to catch up on everything you missed.",
    },
  ],
  Body,
};
