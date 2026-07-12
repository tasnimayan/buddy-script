import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Visibility, MediaType, Gender } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// bcrypt hash of "Password1!" (cost 10) — deterministic for seed reproducibility
const PASSWORD_HASH =
  "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNBIKC";

const CLOUDINARY_SAMPLE_KEYS = [
  "cld-sample-4",
  "sample",
  "cld-sample-2",
  "cld-sample-5",
  "paper",
  "zoom",
  "dessert-on-a-plate",
  "cup-on-a-table",
] as const;

type CloudinarySampleKey = (typeof CLOUDINARY_SAMPLE_KEYS)[number];

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  gender: Gender;
  avatarMediaKey: CloudinarySampleKey;
  dob: Date;
};

const USERS: SeedUser[] = [
  {
    email: "tasnim.chy@gmail.com",
    firstName: "Tasnim",
    lastName: "Chy",
    bio: "Software engineer from Dhaka. Love street food and late-night coding.",
    location: "Dhaka, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "cld-sample-4",
    dob: new Date("1996-03-14"),
  },
  {
    email: "rajib.islam@gmail.com",
    firstName: "Rajib",
    lastName: "Islam",
    bio: "Port city kid. Chittagong hills, sea breeze, and startup ideas.",
    location: "Chittagong, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "sample",
    dob: new Date("1994-07-22"),
  },
  {
    email: "farhana.akter@gmail.com",
    firstName: "Farhana",
    lastName: "Akter",
    bio: "Tea garden memories from Sylhet. Building things on the internet.",
    location: "Sylhet, Bangladesh",
    gender: Gender.Female,
    avatarMediaKey: "cld-sample-2",
    dob: new Date("1998-11-05"),
  },
  {
    email: "imran.hossain@gmail.com",
    firstName: "Imran",
    lastName: "Hossain",
    bio: "Rajshahi mango season is my favorite time of year.",
    location: "Rajshahi, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "cld-sample-5",
    dob: new Date("1993-01-18"),
  },
  {
    email: "nusrat.jahan@gmail.com",
    firstName: "Nusrat",
    lastName: "Jahan",
    bio: "Khulna born. Sundarbans trips and community meetups keep me grounded.",
    location: "Khulna, Bangladesh",
    gender: Gender.Female,
    avatarMediaKey: "paper",
    dob: new Date("1997-09-30"),
  },
  {
    email: "arif.khan@gmail.com",
    firstName: "Arif",
    lastName: "Khan",
    bio: "Barisal river views and weekend cricket with friends.",
    location: "Barisal, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "zoom",
    dob: new Date("1995-06-12"),
  },
  {
    email: "shabnam.begum@gmail.com",
    firstName: "Shabnam",
    lastName: "Begum",
    bio: "Comilla history buff. Always hunting for good fuchka spots.",
    location: "Comilla, Bangladesh",
    gender: Gender.Female,
    avatarMediaKey: "dessert-on-a-plate",
    dob: new Date("1999-04-08"),
  },
  {
    email: "karim.ahmed@gmail.com",
    firstName: "Karim",
    lastName: "Ahmed",
    bio: "Bogura lal doi enthusiast. Backend dev by day.",
    location: "Bogura, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "cup-on-a-table",
    dob: new Date("1992-12-25"),
  },
  {
    email: "lamia.chowdhury@gmail.com",
    firstName: "Lamia",
    lastName: "Chowdhury",
    bio: "Mymensingh to Dhaka commuter. Documenting city life one post at a time.",
    location: "Mymensingh, Bangladesh",
    gender: Gender.Female,
    avatarMediaKey: "cld-sample-4",
    dob: new Date("2000-02-17"),
  },
  {
    email: "rifat.mahmud@gmail.com",
    firstName: "Rifat",
    lastName: "Mahmud",
    bio: "Rangpur winter mornings and open-source contributions.",
    location: "Rangpur, Bangladesh",
    gender: Gender.Male,
    avatarMediaKey: "sample",
    dob: new Date("1991-08-03"),
  },
];

const POST_CONTENTS: (string | null)[] = [
  "Mirpur Road traffic was brutal today — left 30 minutes early and still arrived late.",
  "Nothing beats kacchi biryani from Old Dhaka on a Friday evening.",
  null,
  "Cox's Bazar sunset hits different every single time.",
  "Rickshaw ride through Dhanmondi Lake area before the rain started.",
  null,
  "First time trying fuchka from a cart near TSC — absolutely worth the hype.",
  "Pahela Baishakh prep is in full swing at our office. Love the energy!",
  "Team iftar at a rooftop in Gulshan was the highlight of the week.",
  "Just crossed 1000 commits on my side project between two cuppas of cha.",
  "Reading about delta-region agriculture — fascinating how adaptive farmers are here.",
  null,
  "Debugging at 2 AM while the mosque nearby calls for Fajr. Classic Dhaka dev life.",
  "New blog post on building APIs for local startups — link in bio.",
  "Weekend trip to Srimangal tea gardens was exactly what I needed.",
  "Who else takes the metro from Uttara to Motijheel daily?",
  "Pair programming session with a friend from BUET — super productive.",
  "First open source contribution merged! Celebrated with mishti doi.",
  "TIL about partial indexes in Postgres — game changer for our feed query.",
  "Coffee shop coding at Banani 11 — best kind of workday.",
  "Refactored our auth module before Pohela Falgun rush traffic kicked in.",
  "The async/await pattern is beautiful when done right.",
  "Just deployed to production before iftar. Fingers crossed.",
  "Database migrations saved us during the cricket match traffic spike.",
  null,
  "Friday deploy before a Bangladesh vs India match? Living dangerously.",
  "Code review tip: be kind, be specific, be constructive.",
  "My terminal setup is finally perfect (said no one ever).",
  "GraphQL vs REST — our Dhaka hackathon team went with both.",
  "Ship it! Launch day for our campus project.",
  "Just discovered jq while parsing JSON logs from our Sylhet server.",
  "Postgres is criminally underrated for social feed workloads.",
  "Writing tests first actually saves time during monsoon outage season.",
  "Docker compose up && grab a cup of cha from the kitchen.",
  "The best code is the code you don't have to write.",
  "Mentoring junior devs at our local meetup is the most rewarding part.",
  "CI pipeline went green on first try. Today is a good day.",
  "Sometimes the bug is just a missing semicolon after a long CNG ride home.",
  "Whiteboard session at our co-working space in Uttara went well.",
  "Weekend project: CLI tool to track CNG fare estimates.",
  "The docs were actually helpful this time!",
  "Load testing before Victory Day sale traffic — found interesting bottlenecks.",
  "Kubernetes is overkill for my side project (but I'm using it anyway).",
  "Stack Overflow answer from 2014 saved my day during a deploy.",
  "Functional programming is growing on me.",
  "Just wrote my first database migration by hand. Feels empowering.",
  "API design is an art form — especially for low-bandwidth users.",
  "Monitoring dashboards looking healthy ahead of Eid rush.",
  "The rubber duck debugging method actually works.",
  "Happy coding from Bangladesh, everyone!",
];

const COMMENT_TEXTS: string[] = [
  "Love this! Reminds me of my commute in Dhaka.",
  "Totally agree — Old Dhaka food is unbeatable.",
  "This is so relatable for anyone in Bangladesh.",
  "Great perspective!",
  "Ha, been stuck on that road too!",
  "Well said.",
  "Can you share more details?",
  "This made my day.",
  "Interesting take on local dev life.",
  "100% this.",
  "Couldn't agree more!",
  "Nice one!",
  "Same here in Chittagong!",
  "I needed to hear this today.",
  "Keep it up!",
];

const REPLY_TEXTS: string[] = [
  "Thanks for the kind words!",
  "Glad you liked it!",
  "Absolutely!",
  "Right?!",
  "Appreciate it!",
  "Ha, thanks!",
  "Sure, I'll write more about it soon.",
  "Means a lot!",
];

type PostRecord = {
  id: bigint;
  authorId: string;
  hasContent: boolean;
};

function sampleKey(index: number): CloudinarySampleKey {
  return CLOUDINARY_SAMPLE_KEYS[index % CLOUDINARY_SAMPLE_KEYS.length]!;
}

function pick<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function nextSnowflakeId(): Promise<bigint> {
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    SELECT snowflake_id() AS id
  `;
  return rows[0]!.id;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Step 1: Clean existing data (reverse FK order)
  await prisma.commentLike.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.media.deleteMany();
  await prisma.post.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Step 2: Users & profiles
  const userIds: string[] = [];
  for (const u of USERS) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: PASSWORD_HASH,
        profile: {
          create: {
            firstName: u.firstName,
            lastName: u.lastName,
            bio: u.bio,
            location: u.location,
            gender: u.gender,
            dob: u.dob,
            avatarMediaKey: u.avatarMediaKey,
          },
        },
      },
    });
    userIds.push(user.id);
    console.log(`  ✓ User: ${u.email} (${u.location})`);
  }

  // Step 3: Posts
  const postRecords: PostRecord[] = [];
  const softDeleteIndices = new Set([7, 23, 41]);

  for (let i = 0; i < POST_CONTENTS.length; i++) {
    const authorId = userIds[i % userIds.length]!;
    const content = POST_CONTENTS[i] ?? null;
    const isMediaOnly = content === null;
    const isSoftDeleted = softDeleteIndices.has(i);
    const visibility = i % 5 === 0 ? Visibility.private : Visibility.public;

    const post = await prisma.post.create({
      data: {
        id: await nextSnowflakeId(),
        authorId,
        content,
        visibility,
        mediaCount: isMediaOnly ? 1 : 0,
        deletedAt: isSoftDeleted ? new Date() : null,
      },
    });

    postRecords.push({ id: post.id, authorId, hasContent: !isMediaOnly });
  }
  console.log(`  ✓ Created ${postRecords.length} posts`);

  // Step 4: Media (Cloudinary sample keys)
  let mediaCreated = 0;
  let keyIndex = 0;
  for (const post of postRecords) {
    const shouldHaveMedia = !post.hasContent || Math.random() < 0.3;
    if (!shouldHaveMedia) continue;

    const mediaCount = randomInt(1, 3);
    for (let pos = 0; pos < mediaCount; pos++) {
      await prisma.media.create({
        data: {
          id: await nextSnowflakeId(),
          postId: post.id,
          storageKey: sampleKey(keyIndex++),
          mediaType: MediaType.image,
          extension: "jpg",
          byteSize: BigInt(randomInt(50_000, 5_000_000)),
          position: pos,
        },
      });
      mediaCreated++;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { mediaCount },
    });
  }
  console.log(`  ✓ Created ${mediaCreated} media items`);

  // Step 5: Comments & replies
  const activePosts = postRecords.filter((_, i) => !softDeleteIndices.has(i));
  const commentRecords: { id: bigint; postId: bigint }[] = [];

  for (const post of activePosts) {
    const numComments = randomInt(0, 4);
    for (let c = 0; c < numComments; c++) {
      const commentAuthor = userIds[randomInt(0, userIds.length - 1)]!;
      const comment = await prisma.comment.create({
        data: {
          id: await nextSnowflakeId(),
          postId: post.id,
          authorId: commentAuthor,
          content: COMMENT_TEXTS[randomInt(0, COMMENT_TEXTS.length - 1)]!,
        },
      });
      commentRecords.push({ id: comment.id, postId: post.id });
    }
  }
  console.log(`  ✓ Created ${commentRecords.length} top-level comments`);

  let replyCount = 0;
  for (const parent of commentRecords) {
    if (Math.random() < 0.4) continue;
    const numReplies = randomInt(1, 3);
    for (let r = 0; r < numReplies; r++) {
      const replyAuthor = userIds[randomInt(0, userIds.length - 1)]!;
      await prisma.comment.create({
        data: {
          id: await nextSnowflakeId(),
          postId: parent.postId,
          authorId: replyAuthor,
          parentCommentId: parent.id,
          content: REPLY_TEXTS[randomInt(0, REPLY_TEXTS.length - 1)]!,
        },
      });
      replyCount++;
    }
  }
  console.log(`  ✓ Created ${replyCount} replies`);

  for (const post of activePosts) {
    const total = await prisma.comment.count({
      where: { postId: post.id, deletedAt: null },
    });
    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount: total },
    });
  }
  for (const parent of commentRecords) {
    const replies = await prisma.comment.count({
      where: { parentCommentId: parent.id, deletedAt: null },
    });
    await prisma.comment.update({
      where: { id: parent.id },
      data: { replyCount: replies },
    });
  }

  // Step 6: Post likes
  let postLikeCount = 0;
  for (const post of activePosts) {
    const likers = pick(userIds, randomInt(0, 6));
    for (const likerId of likers) {
      await prisma.postLike.create({
        data: { postId: post.id, userId: likerId },
      });
      postLikeCount++;
    }
    await prisma.post.update({
      where: { id: post.id },
      data: { likeCount: likers.length },
    });
  }
  console.log(`  ✓ Created ${postLikeCount} post likes`);

  // Step 7: Comment likes
  let commentLikeCount = 0;
  const allComments = await prisma.comment.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const comment of allComments) {
    const likers = pick(userIds, randomInt(0, 4));
    for (const likerId of likers) {
      await prisma.commentLike.create({
        data: { commentId: comment.id, userId: likerId },
      });
      commentLikeCount++;
    }
    await prisma.comment.update({
      where: { id: comment.id },
      data: { likeCount: likers.length },
    });
  }
  console.log(`  ✓ Created ${commentLikeCount} comment likes`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
