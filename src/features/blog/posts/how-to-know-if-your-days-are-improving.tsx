import { B, Ext, H2, In, OL, P, UL } from "@/features/blog/components/prose";
import { SOURCES } from "@/features/blog/sources";
import type { Post } from "@/features/blog/types";

function Body() {
  return (
    <>
      <P>
        Ask yourself on a Friday whether it was a good week, and the answer mostly depends on how Thursday went. Memory isn&rsquo;t built for this. It gives
        extra weight to the last few days, the loud moments and whatever mood you&rsquo;re in when you ask. A week of steady work can feel like nothing
        because no single day stood out, and one bad meeting can make a good month feel like a slide.
      </P>
      <P>
        So if you want to know if you&rsquo;re making progress, and whether your days are actually improving, you need something to look back at that
        doesn&rsquo;t change with your mood. That means a written record, kept daily, with a number on each day.
      </P>

      <H2 id="why-feel-doesnt-work">Why &ldquo;how do I feel about it&rdquo; doesn&rsquo;t work</H2>
      <P>
        Most advice on this question is a list of signs: you handle setbacks better, you feel calmer, you compare yourself less. Those can all be true. But
        you can&rsquo;t check any of them on a Tuesday, and you can&rsquo;t see them change from one week to the next.
      </P>
      <P>Three things get in the way when you judge progress by feel:</P>
      <UL>
        <li>
          <B>Recent days count too much.</B> A rough Thursday colors the whole week.
        </li>
        <li>
          <B>Small wins disappear.</B> Teresa Amabile and Steven Kramer studied nearly 12,000 daily diary entries from 238 people. People were happiest and
          most motivated on days they made progress, and more than 28% of small events set off big reactions (<Ext href={SOURCES.amabile}>source</Ext>). A
          month later, almost none of those small days are remembered.
        </li>
        <li>
          <B>There&rsquo;s no baseline.</B> &ldquo;Better&rdquo; means better than something. Without a record of where you were in March, you can&rsquo;t
          say November is an improvement.
        </li>
      </UL>

      <H2 id="what-to-measure">How to know if you&rsquo;re making progress: what to measure</H2>
      <P>Progress means moving toward something, so start by writing down what that is.</P>
      <OL>
        <li>
          <B>Write 3 to 5 goals you can check.</B> &ldquo;Run 4 times a week&rdquo;, &ldquo;Talk to 2 customers a week&rdquo;, &ldquo;In bed by 11&rdquo;.
          Not &ldquo;be healthier&rdquo;.
        </li>
        <li>
          <B>Log what you did, as facts.</B> At the end of the day, or a few times during it, write a short numbered list: &ldquo;1. Ran 2 km 2. Skipped the
          customer call 3. Shipped the login fix.&rdquo;
        </li>
        <li>
          <B>Score the day against your goals.</B> Use a scale from −10 (moved away from everything I care about) to +10 (moved toward all of it). A 0 is a
          day that didn&rsquo;t move anything.
        </li>
        <li>
          <B>Note one boost and one drain.</B> What lifted you today, and what pulled you down.
        </li>
      </OL>
      <P>This takes about two minutes. The score matters most, because 60 paragraphs are hard to compare and 60 numbers are easy.</P>

      <H2 id="look-at-the-trend">Look at the trend, not the day</H2>
      <P>One day tells you very little. Bad days happen inside good months. After two or three weeks of logging, look at four things:</P>
      <UL>
        <li>
          <B>Your 7-day average.</B> Is this week higher than last week?
        </li>
        <li>
          <B>Your share of good days.</B> Of the last 30 days, how many scored +3 or more? Is that more than the month before?
        </li>
        <li>
          <B>How fast you bounce back.</B> After a bad day, how many days until you&rsquo;re above zero again? If that number shrinks, you&rsquo;re improving,
          even if your average hasn&rsquo;t moved yet.
        </li>
        <li>
          <B>Repeat drains.</B> Which things keep showing up on your bad days? Late nights? A certain meeting? Skipped workouts?
        </li>
      </UL>
      <P>If your weekly average is climbing and your bounce-back time is getting shorter, your days are improving, whatever Friday-you thinks.</P>

      <H2 id="keep-the-score-honest">Keep the score honest</H2>
      <P>Scoring yourself has a weak spot: you&rsquo;ll be generous on good days and harsh on bad ones. Three habits help:</P>
      <UL>
        <li>Write what happened before you pick a number.</li>
        <li>Score against the goals you wrote down, not against how you feel.</li>
        <li>Get an outside view now and then, from a friend or a tool that knows your goals.</li>
      </UL>
      <P>
        The effort is worth it. A 2016 review of 138 studies with 19,951 participants found that monitoring progress made people more likely to reach their
        goals. Checking more often helped more, and so did writing progress down or sharing it (<Ext href={SOURCES.apa}>APA</Ext>).
      </P>

      <H2 id="try-it-for-30-days">Try it for 30 days</H2>
      <UL>
        <li>
          <B>Days 1–7:</B> Write your goals. Log and score every day. Don&rsquo;t look at averages yet.
        </li>
        <li>
          <B>Days 8–21:</B> Keep going. At the end of each week, compare the average with the week before.
        </li>
        <li>
          <B>Day 30:</B> Answer three questions. Is your latest 7-day average higher than week one? Do you have more +3 days? Are you bouncing back faster?
        </li>
      </UL>
      <P>Three yeses means you&rsquo;re improving. Any no shows you which goal to look at next.</P>

      <H2 id="how-rumbodia-does-this">How Rumbodia does this for you</H2>
      <P>
        <In href="/">Rumbodia</In> is built around this method. You write short numbered updates during the day, and AI scores each one from −10 to +10
        against your own goals. It&rsquo;s told to be honest, not flattering. Rumbo, the app&rsquo;s mascot, and the app&rsquo;s colors change with your
        level. The Stats page shows your momentum, streak and which tags lift or drain your days. You can try it free for 7 days.
      </P>
    </>
  );
}

export const post: Post = {
  slug: "how-to-know-if-your-days-are-improving",
  title: "How to Know If Your Days Are Actually Improving",
  h1: "How to Know If Your Days Are Actually Improving",
  description:
    "Feeling stuck doesn't mean you are. A simple way to score your days against your goals and see the real trend over weeks.",
  keyword: "how to know if you're making progress",
  published: "2026-11-18",
  mood: "rising",
  readMinutes: 5,
  bannerAlt:
    "A month of daily scores climbing from a week-one average of −2.7 to a week-four average of +4.0, with Rumbo smiling beside the line: trend beats feelings.",
  faq: [
    {
      q: "How long before I can tell if I'm improving?",
      a: "Two to three weeks of daily logs gives you a usable trend. A full month lets you compare one period with another.",
    },
    {
      q: "What if my scores go down?",
      a: "A dip after a hard week is normal. Look at the 30-day trend and your bounce-back time. If the trend falls for a whole month, that's useful too: it tells you which goals are slipping.",
    },
    {
      q: "Isn't scoring my day harsh?",
      a: "The score measures direction toward your goals, not your worth. A −4 is information you can act on.",
    },
  ],
  Body,
};
