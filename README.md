# ResearchMaker

A UK-focused tutoring and academic-support site with a WhatsApp enquiry flow and a private owner CMS. Express serves crawlable React HTML and hydrates the client. The production server renders current MongoDB content, metadata and the sitemap at request time.

## Local development

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The service and tutoring catalogues can be explored without a database. To use the CMS, copy `.env.example` to `.env` and configure MongoDB and an owner account.

## Database and owner setup

1. Create a MongoDB Atlas deployment and a database user with read/write access to a dedicated database, such as `researchmaker`. Permit connections from the application host in the Atlas network access settings.
2. Set `MONGODB_URI` to the Atlas connection string, including the database name. URL-encode special characters in the database password. The app also supports a dedicated local MongoDB database for development.
3. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 14 characters. Start the app once to seed the catalogues and provision the owner. Remove these environment values after provisioning. Browse to `/admin` and sign in.
4. Set `WHATSAPP_NUMBER` to the business number in international digits, or enter it in **Website settings**. The CMS number takes precedence when present. Set `CONTACT_EMAIL` or save an email in the CMS if the business has supplied one.

To reset a password, inject the owner email and new password into the server environment and run `npm run admin:reset`. The command revokes existing sessions. Remove the temporary password variables when finished.

Contact form submissions are saved to MongoDB. Visitors receive an on-screen reference, and signed-in owners can review submissions and update their status under **Contact enquiries**. To enable owner email alerts, configure `RESEND_API_KEY`, `ENQUIRY_NOTIFY_FROM` with a verified sender, and `ENQUIRY_NOTIFY_TO`. Alerts contain the reference and timestamp. Visitors can still use WhatsApp while the form is unavailable.

## Production hosting

Deploy to a Node host with outbound Atlas access and a managed HTTPS endpoint. Use `npm ci && npm run build` in the build stage and `npm start` to serve the production build. Install dev dependencies in the build stage. The runtime needs the application files, `dist/` and production dependencies.

Configure `SITE_URL=https://researchmaker.co.uk` and the host-provided `PORT`. Configure `MONGODB_URI` to enable the CMS, contact-form storage and database-backed content; without it, the public built-in catalogue remains available while database endpoints return `503`. Set `HOST=0.0.0.0` if your environment file contains a loopback override. Set `TRUST_PROXY_HOPS` only when the known proxy topology requires it for client IP rate limiting. Keep the origin behind that proxy and use a same-origin API. Configure the domain and HTTPS in the hosting provider.

The initial catalogue contains 13 services and 15 tutoring categories. Articles and reviews can be published from the dashboard. The legal pages contain marked draft copy for business and legal review. Confirm the business contact details, approve the policy copy in `src/content.ts` and publish authentic content before launch. Test click-to-chat with the real number, check `/sitemap.xml`, and verify the owner can sign in over HTTPS.

## Verification

```sh
npm run check
npm run build
npm test
```

The test suite runs the public site over HTTP and checks server-rendered navigation, catalogue coverage, metadata, WhatsApp encoding and validation. Install a Playwright browser with `npx playwright install chromium`, or set `TEST_BROWSER_CHANNEL=msedge` to use an existing Edge installation. Without a browser the viewport suite reports a skip. Set `MONGODB_TEST_URI` to a dedicated test MongoDB instance to enable production-mode CMS integration tests. The test creates and removes a uniquely named database on that instance.

## Assets and policy references

Photography is sourced from [Unsplash](https://unsplash.com/license). Image URLs used original IDs `1524995997946-a1c2e315a42f`, `1515879218367-8466d910aaa4` and `1455390582262-044cdead277a`. Inter is distributed under the SIL Open Font License. Licence text is in `public/licenses/`.

The privacy and cookie drafts were informed by the ICO’s [right to be informed guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/) and [small organisation cookie guidance](https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/cookies-and-privacy-notices-in-detail).


The service and tutoring imagery is sourced from [Unsplash](https://unsplash.com/license) and delivered locally as optimised WebP files. The original photo IDs are listed below by asset name. CMS uploads take precedence. The desktop explorer uses native CSS sticky positioning with scroll progress sampled in React. Smaller and reduced-motion viewports use manual controls.

- `academic-tutoring` · `1523240795612-9a054b0db644`
- `assignment-guidance-and-academic-support` · `1516321318423-f06f85e504b3`
- `proofreading-and-editing` · `1455390582262-044cdead277a`
- `academic-research-support` · `1532094349884-543bc11b234d`
- `dissertation-and-thesis-guidance` · `1434030216411-0b793f4b4173`
- `research-proposal-guidance` · `1454165804606-c3d57bc86b40`
- `literature-review-support` · `1507842217343-583bb7270b66`
- `referencing-and-citation-assistance` · `1519682337058-a94d519337bc`
- `academic-writing-coaching` · `1517842645767-c639042777db`
- `data-analysis-and-statistical-support` · `1551288049-bebda4e38f71`
- `it-project-mentoring-and-code-review` · `1555066931-4365d14bab8c`
- `legal-research-support` · `1589829545856-d10d557cf95f`
- `educational-content-and-blogging-services` · `1499750310107-5fef28a66643`
- `it-computer-science` · `1515879218367-8466d910aaa4`
- `medical-health-sciences` · `1576091160399-112ba8d25d1d`
- `law-llb` · `1505664194779-8beaceb93744`
- `engineering` · `1581094794329-c8112a89af12`
- `mathematics-statistics` · `1635070041078-e363dbe005cb`
- `physical-natural-sciences` · `1532187863486-abf9dbad1b69`
- `business-management` · `1521737711867-e3b97375f902`
- `accounting-finance-economics` · `1460925895917-afdab827c52f`
- `humanities-social-sciences` · `1500530855697-b586d89ba3ee`
- `english-literature-languages` · `1512820790803-83ca734da794`
- `arts-media-design` · `1513364776144-60967b0f800f`
- `school-college-subjects` · `1509062522246-3755977927d7`
- `test-exam-preparation` · `1513258496099-48168024aec0`
- `research-methods-data-analysis` · `1527474305487-b87b222841cc`
- `professional-career-skills` · `1551836022-d5d88e9218df`


## Tutoring topic management

On startup, the MongoDB migration creates structured topic records from each existing category's legacy list. It leaves existing category documents and topic edits intact. Open **Owner dashboard → Tutoring topics** to create a draft, preview it, upload hero and card images, edit its content or publish it. A topic's category and URL slug are fixed after creation. Published topics are listed only while their parent category is published. Manage visibility in **Tutoring topics**, including for records originally imported from the legacy list.

The topic photography adds three locally hosted Unsplash images. The source photo IDs are `1485846234645-a62644f84728` for Film Studies, `1495020689067-958852a7765e` for Journalism and `1626785774573-4b799315345d` for Graphic Design Theory. The remaining topics use a relevant editorial default or a CMS upload. [Unsplash licence](https://unsplash.com/license)

Topic imagery prefers CMS uploads and falls back to a locally hosted photograph mapped to the subject. Each built-in tutoring topic has its own curated image. The same topic keeps its photograph wherever it appears. See [Photography credits](PHOTO-CREDITS.md) for the expanded library. The medical topic photos use Unsplash source IDs `1551076805-e1869033e561` (Medicine), `1530026405186-ed1f139313f8` (Anatomy), `1579154204601-01588f351e67` (Pathology), `1471864190281-a93a3070b6de` (Pharmacology), `1584515933487-779824d29309` (Nursing) and `1588776814546-1ffcf47267a5` (Dentistry). [Unsplash licence](https://unsplash.com/license)

Additional topic photo sources from Unsplash are `1486406146926-c627a92ad1ab` (office architecture), `1487958449943-2429e8be8625` (building geometry), `1543286386-713bdd548da4` (charts), `1461749280684-dccba630e2f6` (source code), `1503676260728-1c00da094a0b` (education), `1524661135-423995f22d0b` (world map), `1522071820081-009f0129c71c` (team collaboration), `1503387762-592deb58ef4e` (technical drawing) and `1498050108023-c5249f4df085` (workstation). [Unsplash licence](https://unsplash.com/license)
