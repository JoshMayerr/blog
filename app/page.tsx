import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";
import { NextResponse } from "next/server";

export default function Home() {
  return (
    <div className="max-w-3xl prose dark:prose-invert mt-8">
      <div className="">
        <h1 className="my-0 font-extrabold tracking-tighter">Josh Mayer</h1>
        <p>
          I&#39;m currently obsessed with building an agent-run internet where I
          no longer have to use websites with shitty UI or have to write shitty
          React code. I also enjoy writing passing Go tests, the GSW, and
          training for a marathon in April.
        </p>

        <h3>Currently Working On</h3>
        <ul>
          <li>
            Building real-time data infrastructure for an internet without
            websites. Founding team with{" "}
            <Link href={"https://tollbit.com"}>tollbit.com</Link>. We just
            raised a few million.
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

        <h3>Press</h3>
        <ul>
          <li>
            <Link
              href={
                "https://dailyfreepress.com/2023/03/02/bu-freshman-works-to-bring-networking-into-the-next-generation-with-ointtag/"
              }
            >
              &quot;BU freshman works to bring networking into the next
              generation with &lsquo;OintTag&rsquo;&quot;
            </Link>
            . This article was written as I was working on NFC tags to replace
            business cards (called{" "}
            <Link href={"https://ointapp.vercel.app"}>Oint</Link>), which was a
            precursor to <Link href={"#Beme"}>Beme</Link>.
          </li>
        </ul>

        <h3>Other</h3>
        <ul>
          <li>
            Worked at <Link href={"https://sidelinehd.com"}>Sideline HD</Link>{" "}
            and built their volleyball scoring application that serves over
            3,000 high school teams.
          </li>
          <li id="Beme">
            Tried to build <Link href={"https://getbeme.com"}>Beme</Link> an
            updated phone to phone contact sharing service like Bump. It was
            built with a mix of BLE and location services using Flutter.
          </li>
        </ul>
      </div>
    </div>
  );
}
