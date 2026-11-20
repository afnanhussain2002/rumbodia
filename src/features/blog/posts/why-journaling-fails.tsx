import { B, Ext, H2, H3, In, OL, P } from "@/features/blog/components/prose";
import { SOURCES } from "@/features/blog/sources";
import type { Post } from "@/features/blog/types";

function Body() {
  return (
    <>
      <P>
        You bought the nice notebook, or downloaded the app. The first week went well. You wrote a full page on day one, half a page by day four, and by
        week three you&rsquo;d skipped five days in a row and felt a bit guilty every time you saw the thing.
      </P>
      <P>
        If that&rsquo;s you, the problem probably isn&rsquo;t discipline. Journaling helps plenty of people work through their feelings. But most people
        start it hoping to answer a different question: is my life actually going somewhere? For that job, here&rsquo;s why journaling doesn&rsquo;t work,
        in five reasons.
      </P>

      <H2 id="why-journaling-doesnt-work">Why journaling doesn&rsquo;t work for tracking progress</H2>

      <H3 id="blank-page">1. The blank page asks too much</H3>
      <P>
        A journal starts with an empty page and no question. You have to decide what to write about, how much, and how honest to be, at the end of the day
        when you&rsquo;re most tired. On a good evening that&rsquo;s fine. On a long one, it&rsquo;s easier to skip, and skipped days add up.
      </P>

      <H3 id="entries-drift">2. Without a question, entries drift</H3>
      <P>
        When there&rsquo;s no prompt, people write about whatever is loudest. That&rsquo;s usually the problem that&rsquo;s bothering them today. Many
        journals end up as a record of the same worries in slightly different words, with very little about what got done.
      </P>

      <H3 id="missed-day">3. One missed day turns into a story</H3>
      <P>
        A long streak feels great until it breaks. Then the missed day becomes &ldquo;I&rsquo;m not a journaling person&rdquo;, and that story is harder to
        undo than the habit was to keep.
      </P>

      <H3 id="nobody-reads-it">4. Nobody reads it back</H3>
      <P>
        Most journals are write-only. Pages pile up, but you rarely go back to them, so the effort never pays you back with an answer. Writing without
        reviewing is like weighing yourself every day and never looking at the scale.
      </P>

      <H3 id="no-trend">5. Paragraphs can&rsquo;t show a trend</H3>
      <P>
        Even if you did reread six months of entries, you couldn&rsquo;t easily say whether March was better than May. Prose is good at describing a day.
        It&rsquo;s bad at comparing 180 of them.
      </P>

      <H2 id="what-works-instead">What works instead</H2>
      <P>
        Keep what&rsquo;s useful about journaling (writing things down, being honest) and fix the parts that make people stop. Here&rsquo;s the version that
        works:
      </P>
      <OL>
        <li>
          <B>Write a list, not an essay.</B> Three to five numbered lines about what you did. &ldquo;1. Ran 1 km 2. Called two customers 3. Got zero
          sign-ups.&rdquo; It takes a minute and needs no energy.
        </li>
        <li>
          <B>Tie it to goals.</B> Write down 3 to 5 goals once. Each day&rsquo;s list is then measured against them, so you always know what to write about.
        </li>
        <li>
          <B>Give the day a number.</B> Score it from −10 to +10 based on how far it moved you toward those goals. Numbers can be compared. Paragraphs
          can&rsquo;t.
        </li>
        <li>
          <B>Add one feeling, briefly.</B> One thing that lifted you, one that drained you. That keeps the emotional side without turning it into a long
          vent.
        </li>
        <li>
          <B>Review once a week.</B> Five minutes on Sunday: this week&rsquo;s average score, the best and worst day, and which drain came up most.
        </li>
        <li>
          <B>Use a &ldquo;never miss twice&rdquo; rule.</B> Missing a day is normal. Missing two in a row is where habits die. If you missed yesterday,
          today&rsquo;s entry can be one line.
        </li>
      </OL>
      <P>
        There&rsquo;s research behind the writing-it-down part. A review of 138 studies found that monitoring progress toward a goal raised the chance of
        reaching it, and the effect was larger when progress was physically recorded or shared (<Ext href={SOURCES.apa}>APA</Ext>;{" "}
        <Ext href={SOURCES.harkinPaper}>paper</Ext>).
      </P>

      <H2 id="should-you-stop-journaling">Should you stop journaling?</H2>
      <P>
        Not if you enjoy it. If long writing helps you think or calms you down, keep it, maybe once a week instead of daily. Just don&rsquo;t count on it to
        tell you whether you&rsquo;re making progress. Use a short daily log for that, and keep the journal for everything else.
      </P>

      <H2 id="how-rumbodia-fits">How Rumbodia fits</H2>
      <P>
        <In href="/">Rumbodia</In> is the short daily log described above, with the scoring done for you. You write a numbered update, add up to 3 boosts
        and drains, and AI scores it against your goals. Your entries roll up into a calendar of faces and a trend chart, so the weekly review is already
        done when you open the app. Free for 7 days.
      </P>
    </>
  );
}

export const post: Post = {
  slug: "why-journaling-fails",
  title: "Why Journaling Fails (and What Works Instead)",
  h1: "Why Journaling Fails (and What Works Instead)",
  description:
    "Plenty of people quit journaling in weeks. Here's why long entries stall, and a shorter habit that shows you where you're heading.",
  keyword: "why journaling doesn't work",
  published: "2026-11-18",
  mood: "slipping",
  readMinutes: 5,
  bannerAlt:
    "A long journal abandoned after five skipped days, next to a short three-line daily log scored +4 Rising that took two minutes.",
  faq: [
    {
      q: "Is journaling a waste of time?",
      a: "No. It's good for working through feelings. It's just not good at showing whether your days are getting better, because long entries are hard to compare.",
    },
    {
      q: "What should I write in a daily log?",
      a: "A few facts about what you did, measured against your goals, plus one thing that helped and one that didn't. Keep it under five lines.",
    },
    {
      q: "How long until a short log is useful?",
      a: "After about two weeks you'll have enough days to compare one week's average with the next.",
    },
  ],
  Body,
};
