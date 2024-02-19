import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";
import { NextResponse } from "next/server";

export default function Home() {
  return (
    <div className="max-w-3xl prose dark:prose-invert mt-8">
      <div className="">
        <h1 className="my-0 font-extrabold tracking-tighter">Josh Mayer</h1>
        <p>
          I&#39;m obsessed with building an agent-run internet, writing passing
          Go tests, and the GSW.
        </p>

        <h3>Currently Working On</h3>
        <ul>
          <li>
            Building real-time data infrastructure for an internet without
            websites. Founding team with{" "}
            <Link href={"https://tollbit.com"}>tollbit.com</Link>. We just
            raised 6M.
          </li>
          <li>
            Some <Link href={"/posts"}>writing</Link> (like every tech bro)
          </li>
        </ul>

        <h3>Past Work</h3>
        <ul>
          <li>
            Built <Link href={"https://sunflowers.dev"}>sunflowers.dev</Link>.
            An internship application spray and pray bot for over 8,000 students
            in two months. <span className="text-primary">(Aquired)</span>
          </li>
          <li>
            Built{" "}
            <Link href={"https://top.gg/bot/516340661247541248"}>
              Scrimius Bot
            </Link>
            . A Discord bot with 100,000 users that paired Fortnite gamers
            together in the same match.{" "}
            <span className="text-primary">(Oldie but goodie)</span>
          </li>
        </ul>

        <h3>Other</h3>
        <ul>
          <li>
            Worked at <Link href={"https://sidelinehd.com"}>Sideline HD</Link>{" "}
            and built their volleyball scoring application that serves over
            3,000 high school teams.
          </li>
          <li>
            Tried (but lost) to build{" "}
            <Link href={"https://getbeme.com"}>Beme</Link> a phone to phone
            contact sharing service like Bump. Using updated technology like
            BLE.
          </li>
        </ul>
      </div>
    </div>
  );
}
