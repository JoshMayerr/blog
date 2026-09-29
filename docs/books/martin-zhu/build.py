import json, re
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
TITLE = 'Martin Zhu'
SUBTITLE = 'From Encrypted Photos to the Agentic Web'
pages = []
def page(title, text, sources=()):
    pages.append(dict(page=len(pages)+1, label=str(len(pages)+1), title=title, text=text.strip(), sources=list(sources)))

page('Martin Zhu', '''From Encrypted Photos to the Agentic Web

A short professional biography

An encrypted photograph, a restaurant reservation, and a website visited by an AI agent seem to belong to different worlds. In Martin Zhu's public work, they sit within the same career: projects that turn complicated systems into something another person can use.

This book follows that career through university teaching, early software projects, privacy research, restaurant technology, and technical leadership at TollBit. Its organizing idea is access: how information moves, how people find it, and how software gives them control over it.

That connection is an editorial reading of the work, not a claim about Martin's private motivations. The story is drawn from his professional profile, public project documentation, university reporting, and product announcements. It is a documented portrait, not an interview or an authorized autobiography.

Research edition | 23 September 2026''', ['S1','S2','S5'])

contents = [
('Brown: The Foundations',3),('Teaching What You Know',4),
('Dataworx: Working with Moving Data',5),('From a Stream to a Useful Answer',6),
('Facebook: Making Systems Agree',7),('HubSpot and the Builder Alongside It',8),
('Pixek: A Different Kind of Photo Album',9),('Search Without Surrender',10),
('A Research Idea Meets the Public',11),('Toast: Software at the Restaurant Door',12),
('From New Ventures to Engineering Leadership',13),('TollBit: A New Kind of Visitor',14),
('The Boundary Becomes the Product',15),('Making the First Steps Clear',16),
('From Pages to Topics and Actions',17),('The People Behind the Software',18),
('Sources: The Early Chapters',19),('Sources: The Later Chapters',20)]
page('Contents', '\n'.join(f'{p:02d}   {t}' for t,p in contents) + '\n\nAll references use the numbered pages in this edition. Chapter titles and body text are searchable. Bracketed source IDs refer to the source notes on pages 19 and 20.')

page('Brown: The Foundations', '''Martin's LinkedIn profile places his computer science studies at Brown University between 2013 and 2017. The degree is a Bachelor of Science. Those dates establish the academic frame for several projects that appear later in this book. [S1]

His record is already varied within that frame. Teaching, an internship in distributed data processing, startup experiments, and work on a network compatibility kit overlap with the undergraduate years. College appears here as a period in which study and implementation happened alongside each other. [S2]

A course provides a defined problem and a shared vocabulary. A working application introduces another set of questions: what happens when a component fails, when input arrives continuously, or when a user expects a result that the system cannot yet produce? The early projects make those questions concrete.

The surviving record does not tell us which lecture changed his mind, which assignment first excited him, or how he chose computer science. It does show someone moving between learning a subject, explaining it to others, and putting it to work. That movement is a useful starting point for the career that follows.''', ['S1','S2'])

page('Teaching What You Know', '''Martin lists a teaching-assistant appointment at Brown's computer science department from January 2015 through May 2017. His responsibilities included office hours, grading, and developing course material. The profile identifies five course appointments across five semesters. [S2]

Spring 2015: CSCI0180, Integrated Introduction to Computer Science.
Fall 2015: CSCI0330, Introduction to Systems.
Spring 2016: CSCI0320, Introduction to Software Engineering.
Fall 2016: CSCI1570, Algorithms.
Spring 2017: CSCI1430, Computer Vision.

The sequence moves through several different scales of thinking. Introductory programming asks how to express a solution. Systems work asks how software behaves on the machinery underneath it. Software engineering considers how a program becomes a project people can maintain. Algorithms focus attention on the structure and cost of a solution. Computer vision asks how software can interpret images.

These are descriptions of the subjects, not a reconstruction of his classroom conversations. Still, teaching adds a distinctive kind of work to the biography. A solution that makes sense privately must become an explanation that someone else can follow. In later product work, a similar demand returns: technical capability has to become understandable behavior.''', ['S2'])

page('Dataworx: Working with Moving Data', '''In 2015, Martin worked as a data science intern at Velankani Information Systems. His current professional profile dates the internship from March to September. It associates the work with distributed data analysis and links directly to Dataworx. [S2]

The repository explicitly credits Martin as its creator, with guidance from Velankani's Office of the CTO and Murali Raju. Its documented test setup used 15 instances. That number describes the project's test environment, not customers, employees, or a measure of commercial adoption. [S3]

Streaming data changes the shape of a computing problem. With a static file, a program can begin with the whole input in front of it. With a stream, more input may arrive while earlier input is still being processed. The system needs a way to receive it, organize the work, and preserve results.

Dataworx belongs to that practical world. Its importance in Martin's story is concrete: an early internship produced a public software artifact, with an explanation other developers could inspect. The repository provides a firmer anchor than a job title alone. It lets the reader see what kind of problem the work was trying to solve.''', ['S2','S3'])

page('From a Stream to a Useful Answer', '''Dataworx's example application follows tweets through a processing pipeline. Kafka receives the stream, Spark handles analysis, and a classifier identifies likely hiring posts. Results go into MongoDB and Neo4j. A separate batch tool examines posting patterns for possible bots. The README lists five principal supported components: HDFS, MongoDB, Neo4j, Spark, and Kafka. [S3]

The central distinction is between collecting information and making it useful. A message that contains the word "job" is not necessarily an offer of employment. Turning a feed into a useful result requires an interpretation of the message, not just its arrival in a database.

That is a general problem for software built around information. The incoming material has a format; the person using it has a purpose. A pipeline joins those two things through a series of explicit decisions. Each stage can make the next stage simpler, while also introducing assumptions that need to be understood.

Looking back from Martin's later work, the bot-analysis tool is an interesting early appearance of automated behavior as a subject of investigation. It does not establish a direct line of invention to TollBit. It gives the career a documented point of comparison: before the agentic web, there were already streams to interpret.''', ['S3'])

page('Facebook: Making Systems Agree', '''Martin's Facebook internship ran from May through August 2016. He describes developing an open-source Technology Compatibility Kit for ReactiveSocket using two programming languages, Java and Scala, and collaborating with Netflix engineers on the project. [S2]

The repository linked from his profile now redirects to the RSocket organization. Its stated purpose is to test implementations of a communication protocol across languages; it also points readers to the older Scala implementation. [S4]

A protocol is an agreement about behavior. Two programs may be written by different teams and still need to exchange messages correctly. A compatibility kit makes parts of that agreement executable: given a particular input, does the other side respond as expected?

This work concerns the boundary between systems. An implementation can appear correct in isolation and still fail when another implementation makes a different assumption. Testing the interaction exposes disagreements that a local demonstration may miss.

The internship therefore adds another dimension to the early biography. Dataworx joined components to process information. The compatibility kit examined whether communicating components could honor the same rules. Both are practical concerns, and both become more important when software moves beyond the control of one developer or one team.''', ['S2','S4'])

page('HubSpot and the Builder Alongside It', '''After Brown, Martin lists a software-engineering role at HubSpot from July 2017 to January 2018. An older personal-site listing describes work on CRM notifications and a migration to a new notification platform. The dates agree with his current professional profile. [S2, S6]

The same years also contain entrepreneurial work. His profile dates Botler from May 2016 to May 2018 and describes a service for publishing and sharing information through chatbots. Earlier, from May to October 2015, he lists a co-founder and engineering-lead role at MAHI Technologies, a project using speech recognition to surface information relevant to a conversation. [S2]

These entries should be read as overlapping activities. They do not form a sequence of full-time jobs that can simply be added together. They also do not, by themselves, establish revenue, adoption, or the eventual outcome of either venture.

What they do document is a recurring product question: how does information reach someone at the moment it becomes useful? A notification, a conversational assistant, and a chatbot each offer a different answer. The interfaces change; the task of connecting stored information with a person's immediate purpose remains.''', ['S2','S6'])

page('Pixek: A Different Kind of Photo Album', '''On 24 January 2018, Brown's computer science department reported the release of Pixek. It named three collaborators: professor Seny Kamara, postdoctoral researcher Tarik Moataz, and Brown alumnus Martin Zhu. The application combined cloud photo storage with encrypted search. [S5]

A photo album is an unusually personal software product. Its value may lie in an ordinary picture that cannot be recreated. Keeping a copy somewhere else can protect against a lost device, but the copy raises a different question: who can inspect it?

Pixek placed that question near the center of the design. Brown described images being encrypted on the user's device before storage on the service's servers, with the key remaining on the device. [S5]

For the biography, the collaboration matters as much as the product category. Here Martin appears in a university account of applied cryptography, alongside researchers translating a technical idea into an application. The public record supports shared credit. It does not divide every design decision or implementation task among the three people.

The result was an attempt to preserve an everyday convenience while changing the conditions under which it was provided. The photograph could leave the phone without becoming ordinary readable material for the storage service.''', ['S5'])

page('Search Without Surrender', '''Storage was only part of Pixek's problem. Brown described automatic image analysis producing tags, which were encrypted along with the photographs. A user's search generated a token that allowed the relevant encrypted items to be located. The article called the technique structured encryption. [S5]

That distinction matters because keeping information and finding information are different operations. A locked archive is useful only if its owner can recover the right item. Search creates a second interaction with the system, and that interaction needs its own design.

Martin's older personal-site listing adds implementation detail: image tagging ran on the mobile device using TensorFlow, and the project involved recovery protocols for lost or replacement devices. These are historical descriptions of the work, not claims that the service is still available today. [S6]

A recovery mechanism illustrates the tension especially well. Someone who loses a phone may still need access to years of photographs. But making recovery easy for the owner must not make access easy for someone else. A product has to reconcile the desired experience with the boundaries its security design creates.

Pixek gives this career story a clear example of software built around a constraint. Privacy was part of the problem the application had to solve.''', ['S5','S6'])

page('A Research Idea Meets the Public', '''Brown's release story described an Android alpha and plans for later versions. Those plans should not be mistaken for evidence that the later releases happened. Seny Kamara's selected-talks page also lists the Pixek collaboration and links to presentations at Real World Crypto and OURSA. It is evidence of the project's public presentation, not proof that Martin personally delivered each talk. [S5, S7]

There is a useful difference between a research idea, a demonstration, and an established service. An idea can show that an approach is possible. A demonstration can make the approach tangible. An established service must keep working as users, devices, and circumstances change.

Pixek brought the idea into an interface people could recognize. That made the underlying design easier to discuss: the question was no longer only whether a cryptographic construction worked, but how it could fit into a familiar activity.

This book does not assign Pixek an invented commercial ending. The available sources establish the collaboration and its public emergence. That is enough to explain its place here. It shows Martin involved in moving a specialized technical capability toward ordinary use, a pattern that would reappear in a very different setting at Toast.''', ['S5','S7'])

page('Toast: Software at the Restaurant Door', '''Martin joined Toast as a software engineer in January 2018. His profile describes him as a founding member of the Toast Takeout app team, contributing to both the frontend and backend as the product moved toward public release. [S2]

One account from that role is particularly concrete. Martin says he worked with Toast's CTO on the DoorDash integration after COVID hit. The project had originally been planned for nine months; according to his profile, the first restaurant received the rollout within three weeks. Those are the planned timeline and the time to first rollout, not interchangeable measures of a completed company-wide deployment. [S2]

A restaurant product has to meet the day as it happens. An order comes from a customer, reaches a business, and becomes work for people operating under immediate constraints. A delivery connection introduces another party into that sequence. The interface is only one part of what must hold together.

The profile's story describes engineering under a suddenly compressed timetable. It should be attributed as Martin's account, rather than treated as an independently audited performance record. Even with that qualification, it gives the Toast chapter an unusually specific focus: a system boundary became an urgent operational need.''', ['S2'])

page('From New Ventures to Engineering Leadership', '''Martin's Toast profile records four successive titles: Software Engineer, Senior Software Engineer, Staff Software Engineer, and Engineering Manager II. His final listed Toast role ran from March 2023 to February 2024. [S2]

Across the earlier roles, he describes work on Order with Google, a new waitlist and reservations platform, Toast Cash, and Reserve with Google. As a staff engineer, he reports helping move Toast Tables into Toast's scaled architecture. As a manager, he says he managed and mentored nine engineers working across the restaurant-facing application, backend systems, and guest-facing pages. [S2]

The change of title expands the unit of responsibility. A developer can focus on a component; a technical lead must consider how components fit together; a manager also has to help people make decisions and develop their capabilities. These responsibilities can overlap, and Martin's account explicitly describes continued coding and architectural involvement.

The nine-person team is a reported team size for that role. It is not Toast's engineering headcount or a statement about his current organization. Keeping the number attached to its original context preserves what makes it meaningful: the scale of the team he describes leading at a particular point in his career.''', ['S2'])

page('TollBit: A New Kind of Visitor', '''Martin's LinkedIn experience page places the start of his CTO role at TollBit in February 2024, the same month in which his Toast employment ends. The profile does not provide exact transition days, so it supports a month-level chronology. [S2]

The company's subject is another changing relationship between software and the people who depend on it. A website may receive a human reader, a crawler collecting information, or an AI agent retrieving material for someone else. Those visitors can produce similar requests while serving different purposes.

TollBit's public product announcements describe tools for publishers to understand AI traffic and manage how their content is accessed. Martin's own posts discuss the engineering and design teams behind those products. They place him within a working organization, rather than presenting every feature as a solitary invention. [S8, S9]

The earlier chapters provide useful comparisons. At Facebook, the work involved agreed behavior between software implementations. At Toast, it involved connections among platforms and restaurant operations. At TollBit, the boundary is between a website and automated visitors. These are different businesses and technologies. What links them in this account is the need to make an interaction explicit enough that a system can support it.''', ['S2','S8','S9'])

page('The Boundary Becomes the Product', '''TollBit's Portfolio Analytics announcement describes a practical difficulty for publishers operating several sites: understanding the whole portfolio required piecing together separate site-level views. The product offered a centralized way to examine that activity. A public comment from co-founder Olivia Joslin includes Martin among the people credited for the work. [S9]

The underlying product question is straightforward. A useful local view does not automatically become a useful overall view when a business has many properties. Someone must decide what can be compared, what should remain separate, and how to make the result understandable.

This chapter's connection to Martin's earlier work is an interpretation, not a quotation from him. Dataworx turned a stream into stored results; portfolio analytics turns activity across properties into a view a publisher can use. Both illustrate the difference between possessing data and being able to act on it.

A CTO's title alone cannot tell us who wrote a particular feature or made a particular decision. Product announcements and credited collaborators give the account firmer boundaries. They show Martin participating in a team whose work makes a new kind of website activity visible, while leaving room for the contributions of the people working beside him.''', ['S9'])

page('Making the First Steps Clear', '''In a public post about publisher onboarding, Martin introduced a revised setup experience. The accompanying demonstration moves from adding a property to verification and analytics configuration, with instructions presented inside the flow. His announcement specifically credits five colleagues: Luke Reisch, Harseet Panigrahi, Anthony Vivio, Yanosh Govoshi, and Priya Chawla. [S8]

Five is the number of colleagues named in that post, excluding Martin. It is not a claim about the complete project team. Luke is credited with leading engineering, the three designers with design, and Priya with product. [S8]

Onboarding is where a product's promises first encounter an unfamiliar user's environment. The person setting up the service needs to know what to do now, why it matters, and how to tell whether it worked. A capability that exists technically can remain inaccessible in practice if those steps are unclear.

The post is useful biographical evidence because it records Martin presenting a concrete product change and acknowledging how it was made. It also gives the book a small example of technical leadership in public: the explanation centers on the user's path, while the credit identifies the people responsible for moving that path forward.''', ['S8'])

page('From Pages to Topics and Actions', '''Martin's public activity includes an announcement celebrating the team behind TollBit Trends. His comments distinguish the engineering work on understanding content from the design work needed to present the resulting information. The company describes the product as a view into the topics AI systems are reading. [S10]

Another post thanks colleagues and KERNEL in connection with Agent Sites for eCommerce. The accompanying company announcement describes a surface intended to help agents interact with websites. This is a company product claim shared by Martin, not a measurement of his individual output. [S11]

The two examples address different questions. Understanding a topic asks what information is in demand. Supporting an action asks whether a visitor can complete a process. Reading and acting are related, but success in one does not guarantee success in the other.

For this biography, the interesting development is the widening interface. Earlier products helped people receive notifications, locate photographs, or manage reservations. These announcements concern software encountering software as a user. They carry the same practical burden as the earlier systems: a useful capability must survive the actual interaction, including the places where the other side behaves differently than its designers expected.''', ['S10','S11'])

page('The People Behind the Software', '''Martin's profile lists volunteer work with The Boston Project Ministries beginning in June 2013. It also lists English and Chinese Mandarin at native or bilingual proficiency. Those entries add dimensions to the professional record, although they do not establish a volunteer-hours total or a detailed account of his life outside work. [S1]

The work itself is repeatedly collaborative. The teaching appointments involved students and faculty. Dataworx credits guidance from Velankani. Pixek appears as a named research collaboration. The later product posts acknowledge engineers, designers, and product colleagues.

A biography built from public work can describe that pattern without inventing the conversations behind it. It cannot tell the reader what Martin was thinking at every transition. It can show the kinds of responsibilities he took on and the artifacts through which those responsibilities became visible.

The record leaves us with a builder working across several forms of access: access to an explanation, a stream of data, a private photograph, a restaurant service, or a website's content. The settings change. The enduring question in this reading of his career is how to make a complex system useful to the next person or program that needs it. The answer appears in the work, one interface at a time.''', ['S1','S2','S3','S5','S8'])

sources = {
'S1': ('Martin Zhu, LinkedIn profile', 'https://www.linkedin.com/in/martin-zhu-94134588/', 'Browser inspection. Education, project listing, languages, and volunteering. Self-reported; present-tense entries are a snapshot.'),
'S2': ('Martin Zhu, LinkedIn experience', 'https://www.linkedin.com/in/martin-zhu-94134588/details/experience/', 'Browser inspection. Career dates, teaching appointments, internship languages, Toast roles, rollout account, and management responsibilities. Self-reported.'),
'S3': ('Dataworx, project README', 'https://github.com/xytosis/dataworx', 'Credits Martin as creator. Documents the pipeline, supported components, and test environment. Historical project documentation.'),
'S4': ('RSocket Technology Compatibility Kit', 'https://github.com/rsocket/rsocket-tck', 'The old ReactiveSocket URL redirects here. Explains compatibility testing and links to the earlier Scala implementation.'),
'S5': ('Brown CS, Pixek release report', 'https://cs.brown.edu/news/2018/01/24/kamara-moataz-and-zhu-use-structured-encryption-create-pixek-ensuring-privacy-digital-photos/', 'Jesse Polhemus, 24 January 2018. Identifies the collaborators and describes encrypted storage, search, and the Android alpha.'),
'S6': ('Martin Zhu, historical personal site', 'https://martinjzhu.com/', 'Search-index text only: direct access failed a certificate check. Used narrowly for CRM notifications and Pixek implementation details, not current status.'),
'S7': ('Seny Kamara, selected talks', 'https://cs.brown.edu/people/seny/talks/', 'Lists the Pixek collaboration with Real World Crypto and OURSA presentation links. Does not establish that Martin delivered both talks.'),
'S8': ('Martin Zhu, publisher onboarding post', 'https://www.linkedin.com/posts/martin-zhu-94134588_im-proud-to-announce-the-rollout-of-our-activity-7331352123248410624-WFuB', 'Public announcement and demonstration transcript. Colleagues are explicitly credited; acknowledgments do not establish total staffing.'),
'S9': ('TollBit, Portfolio Analytics announcement', 'https://www.linkedin.com/posts/tollbit_introducing-portfolio-analytics-tollbit-activity-7406416673584414720-mXfV', 'Company description and Olivia Joslin comment crediting Martin and colleagues. Company claims are attributed, not independently audited.'),
'S10': ('Martin Zhu, TollBit Trends post', 'https://www.linkedin.com/feed/update/urn:li:activity:7483238333037412353/', 'Read in profile activity. Acknowledges the engineering and design work behind the accompanying company announcement.'),
'S11': ('Martin Zhu, Agent Sites post', 'https://www.linkedin.com/feed/update/urn:li:activity:7457808902504652801/', 'Read in profile activity. Thanks colleagues and KERNEL alongside the company launch announcement.')}
page('Sources: The Early Chapters', '\n\n'.join(f'[{key}] {sources[key][0]}\n{sources[key][2]}' for key in ['S1','S2','S3','S4','S5']) + '\n\nSource titles are clickable in the PDF. The editable manuscript and page-data file retain the full URLs. Sources were reviewed for this edition on 23 September 2026.')
page('Sources: The Later Chapters', '\n\n'.join(f'[{key}] {sources[key][0]}\n{sources[key][2]}' for key in ['S6','S7','S8','S9','S10','S11']) + '\n\nEditorial note: the older personal site differs from LinkedIn on the Velankani and Botler start months. This edition uses LinkedIn for those dates. Elapsed-duration badges, follower counts, and "Present" labels are not used as fixed historical quantities.')
assert len(pages)==20
book = dict(id='martin-zhu-biography-v1',title=TITLE,subtitle=SUBTITLE,description='A sourced short professional biography. Game edition, 23 September 2026.',contents=[dict(title=t,page=p) for t,p in contents],pages=pages,sources={k:dict(title=v[0],url=v[1],note=v[2]) for k,v in sources.items()})
(HERE/'book.json').write_text(json.dumps(book,indent=2,ensure_ascii=False)+'\n')
md = '# '+TITLE+'\n\n'+SUBTITLE+'\n\n'
for p in pages:
    md += f'<!-- PAGE {p["page"]:02d} -->\n\n## Page {p["page"]}: {p["title"]}\n\n'
    text=p['text']
    if p['page']==2:
        text='\n'.join(f'- [{t}](#page-{n}-{re.sub(r"[^a-z0-9 -]", "", t.lower()).replace(" ", "-")}) - page {n}' for t,n in contents)+'\n\nAll page references use this edition’s fixed page numbers.'
    md+=text+'\n\n---\n\n'
md+='## Source links\n\n'+'\n'.join(f'[{k}]: {v[1]} "{v[0]}"' for k,v in sources.items())+'\n'
(HERE/'manuscript.md').write_text(md)

out=ROOT/'output/pdf/martin-zhu-book.pdf'
c=canvas.Canvas(str(out),pagesize=(432,648))
c.setTitle(TITLE+' - '+SUBTITLE); c.setAuthor('Research edition prepared for Josh Mayer')
ink=HexColor('#16363a'); accent=HexColor('#b36a39'); muted=HexColor('#667373')
body=ParagraphStyle('body',fontName='Times-Roman',fontSize=11.2,leading=15.6,textColor=ink,spaceAfter=11)
small=ParagraphStyle('small',parent=body,fontName='Helvetica',fontSize=8.4,leading=11.8)
heading=ParagraphStyle('heading',fontName='Times-Bold',fontSize=24,leading=27,textColor=ink)
def draw_para(text,y,style=body):
    para=Paragraph(text,style)
    _,h=para.wrap(328,600)
    assert y-h>47, ('Page overflow',c.getPageNumber(),y,h)
    para.drawOn(c,52,y-h)
    return y-h-style.spaceAfter
for p in pages:
    n=p['page']; c.bookmarkPage(f'p{n}'); c.addOutlineEntry(p['title'],f'p{n}',0)
    c.setFillColor(HexColor('#fbf8f1')); c.rect(0,0,432,648,fill=1,stroke=0)
    c.setFillColor(muted); c.setFont('Helvetica',8)
    c.drawString(52,615,'MARTIN ZHU  /  A PROFESSIONAL PORTRAIT')
    c.setStrokeColor(accent); c.line(52,603,380,603)
    c.drawString(52,29,'RESEARCH EDITION  /  SEPTEMBER 2026'); c.drawRightString(380,29,f'{n:02d}')
    if n==1:
        c.setFillColor(ink); c.setFont('Times-Bold',44); c.drawString(52,531,'Martin Zhu')
        y=draw_para(SUBTITLE,490,ParagraphStyle('sub',parent=heading,fontSize=21,leading=25))
        y-=35
        blocks=p['text'].split('\n\n')[2:-1]
        for block in blocks: y=draw_para(escape(block),y)
        c.setFillColor(accent); c.setFont('Helvetica',9); c.drawString(52,76,'A SHORT PROFESSIONAL BIOGRAPHY')
    else:
        y=draw_para(escape(p['title']),576,heading)-18
        if n==2:
            for title,number in contents:
                c.setFont('Helvetica',9.4); c.setFillColor(ink); c.drawString(52,y,title)
                c.setFillColor(accent); c.drawRightString(380,y,str(number))
                c.linkRect('',f'p{number}',(50,y-4,382,y+12),relative=0,thickness=0)
                y-=22
            draw_para('All page references use this edition. Source IDs point to the notes on pages 19 and 20.',y-12,small)
        else:
            style=small if n>=19 else body
            for block in p['text'].split('\n\n'):
                t=escape(block).replace('\n','<br/>')
                if n>=19:
                    for key,(title,url,note) in sources.items():
                        t=t.replace(escape(title),f'<link href="{escape(url)}" color="#b36a39">{escape(title)}</link>')
                else:
                    t=re.sub(r'\[(S\d+(?:, S\d+)*)\]',lambda m:'<font size="8" color="#b36a39">'+m.group(0)+'</font>',t)
                y=draw_para(t,y,style)
    c.showPage()
c.save()
reader=PdfReader(out)
assert len(reader.pages)==20
for p, rendered in zip(pages,reader.pages):
    text=rendered.extract_text()
    assert ' '.join(p['title'].split()) in ' '.join(text.split()),(p['page'],'missing title')
    assert len(text)>100
print(json.dumps(dict(pdf=str(out),pages=len(reader.pages),words=sum(len(p['text'].split()) for p in pages),page_words=[len(p['text'].split()) for p in pages]),indent=2))
