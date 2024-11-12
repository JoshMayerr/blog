import Link from "next/link";
import Image from "next/image";
export default function Home() {
  return (
    <div className="max-w-3xl prose dark:prose-invert mt-6">
      <div className="">
        <div className="relative inline-block mb-6">
          <Image
            src={"/asciijosh.png"}
            alt="Josh Mayer"
            width={100}
            height={100}
            className="rounded-xl bg-black my-0"
            draggable={false}
          />
          <div className="absolute inset-0 hover:bg-gradient-to-tr from-blue-400 to-emerald-400 mix-blend-multiply rounded-xl transition duration-300 animate-pulse"></div>
          {/* <div className="absolute inset-0 bg-blue-500 opacity-50 rounded-xl  hover:bg-emerald-500"></div> */}
        </div>

        <h1 className="my-0 font-extrabold tracking-tighter">Josh Mayer</h1>
        <p>
          I&#39;m currently obsessed with building an agent-run internet where I
          no longer have to use websites with shitty UI or have to write shitty
          React code. I also enjoy watching the Golden State Warriors and
          training for a marathon in April.
        </p>

        <h3>Currently Working On</h3>
        <ul>
          <li>
            Infrastructure for agents to access licensed data and take actions
            at scale, called <Link href={"https://tollbit.com"}>TollBit</Link>.
          </li>
          <li>
            Researching delegated authorization for agents with Professor Sharon
            Goldberg at BU.
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
            in two months. (
            <Link
              href={
                "https://www.linkedin.com/posts/jooshmayer_super-hyped-to-share-that-my-latest-project-activity-7125333989392822272-psWC"
              }
            >
              acquired
            </Link>
            )
          </li>
          <li>
            Worked on <Link href={"https://sidelinehd.com"}>Sideline HD</Link>{" "}
            and built their volleyball scoring application that serves over
            100,000 high school teams. (
            <Link href={"https://home.sidelinehd.com/called-up"}>acquired</Link>
            )
          </li>
          <li>
            Built{" "}
            <Link href={"https://top.gg/bot/516340661247541248"}>
              Scrimius Bot
            </Link>{" "}
            when I was 14. A Discord bot with 100,000 users that paired Fortnite
            gamers together in the same match.{" "}
            <span className="text-primary">(Oldie but goodie)</span>
          </li>
        </ul>

        <h3>Press</h3>
        <ul>
          <li>
            <Link
              href={
                "https://www.axios.com/2024/10/22/ai-startup-tollbit-media-publishers/"
              }
            >
              Exclusive: AI startup TollBit raises $24M series A
            </Link>
            . A Sara Fischer article written to announce our Series A fundraise.
          </li>
          <li>
            <Link
              href={
                "https://www.axios.com/2024/03/05/tollbit-8-million-publisher-ai-marketplace/"
              }
            >
              Tollbit raises $7 million to solve the AI vs. publisher conflict
            </Link>
            . A Dan Primack article written to the seed round.
          </li>
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
            precursor to Beme.
          </li>
        </ul>

        <h3>Other</h3>
        <ul>
          <li id="Beme">
            Tried to build Beme: an updated phone to phone contact sharing
            service like Bump. It was built with a mix of BLE and location
            services using Flutter.
          </li>
          <li>
            I used to really love graphic design, so a lot of my design work is
            on <Link href={"https://www.behance.net/jooshmayer"}>Behance.</Link>
          </li>
          <li>
            I make{" "}
            <Link href={"https://www.youtube.com/@jooshmayer"}>tutorials</Link>{" "}
            on Youtube
          </li>
        </ul>
      </div>
    </div>
  );
}
