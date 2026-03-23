/**
 * Database seed — npx ts-node -r tsconfig-paths/register src/database/seed.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ResourcesService } from '../resources/resources.service';
import { BlogService } from '../blog/blog.service';
import { QuestionsService } from '../questions/questions.service';
import { UserRole } from '../users/user.entity';
import { ResourceType, ResourceCategory } from '../resources/resource.entity';

// ─── Image references ─────────────────────────────────────────────────────────
// Local images (served from /public)
const LOCAL = {
  john:    '/john.jpeg',
  kabarak: '/kabarak.png',
  citam:   '/citam.png',
};

// Unsplash thematic placeholders
const IMG = {
  // Institutions
  uon:         'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=800&q=80', // university campus Africa
  strathmore:  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', // modern campus
  onetribe:    'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=800&q=80', // contemporary church interior
  // Topics
  cosmos:      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80',
  openbook:    'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
  philosophy:  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
  handsbible:  'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=800&q=80',
  cross:       'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
  africa:      'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=800&q=80',
  discussion:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  library:     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
  podcast:     'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
};

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const users     = app.get(UsersService);
  const resources = app.get(ResourcesService);
  const blog      = app.get(BlogService);
  const questions = app.get(QuestionsService);

  console.log('🌱 Seeding database…');

  // ─── Admin ─────────────────────────────────────────────────────────────────
  let admin;
  try {
    admin = await users.create({
      email: 'admin@apologeticsafrica.com',
      firstName: 'John',
      lastName: 'Njoroge',
      password: 'AdminPass123!',
      role: UserRole.ADMIN,
    });
    console.log('✓ Admin:', admin.email);
  } catch {
    admin = await users.findByEmail('admin@apologeticsafrica.com');
    console.log('✓ Admin already exists');
  }

  // ─── Resources ─────────────────────────────────────────────────────────────
  const resourceSeeds = [

    // ── Sermons ──────────────────────────────────────────────────────────────
    {
      title: 'Faith and Reason — Sermon at CITAM Valley Road',
      description: 'Rev. Dr. Njoroge preaches at CITAM Valley Road on Paul\'s call to love God with our minds, drawing from Romans 12:2 and 1 Peter 3:15.',
      content: 'Delivered at Christ Is The Answer Ministries (CITAM) Valley Road, this sermon explores Paul\'s exhortation in Romans 12:2 — "be transformed by the renewing of your mind" — and why intellectual engagement with the Christian faith is not optional but central to discipleship.',
      type: ResourceType.SERMON,
      category: ResourceCategory.GENERAL,
      tags: ['faith', 'reason', 'CITAM', 'Romans', 'discipleship'],
      bookOfBible: 'Romans',
      thumbnailUrl: LOCAL.citam,
      featured: true,
      published: true,
    },
    {
      title: 'What Does John 1 Teach About the Nature of Christ? — One Tribe Church Nairobi',
      description: 'A verse-by-verse sermon at One Tribe Church Nairobi exploring the Prologue of John and the eternal divinity of Jesus Christ.',
      content: 'Delivered at One Tribe Church Nairobi. John 1:1 opens with one of the most theologically dense sentences in all of Scripture: "In the beginning was the Word, and the Word was with God, and the Word was God." This sermon walks through the Prologue of John (1:1–18), examining what John means by "Logos" and the significance of the Incarnation for apologetics.',
      type: ResourceType.SERMON,
      category: ResourceCategory.RESURRECTION,
      tags: ['christology', 'incarnation', 'One Tribe', 'Logos', 'John'],
      bookOfBible: 'John',
      thumbnailUrl: IMG.onetribe,
      featured: false,
      published: true,
    },
    {
      title: 'Wisdom Literature and the Problem of Evil — Sermon on Job',
      description: 'A pastoral sermon through Job 38–42 examining God\'s response to suffering and what it teaches about theodicy.',
      content: 'The book of Job is the Bible\'s most extensive treatment of the problem of evil. When God finally speaks from the whirlwind in chapters 38–42, he does not answer Job\'s questions directly — he redirects Job\'s gaze to the greatness and wisdom of the Creator.',
      type: ResourceType.SERMON,
      category: ResourceCategory.SUFFERING,
      tags: ['suffering', 'theodicy', 'Job', 'wisdom literature'],
      bookOfBible: 'Job',
      thumbnailUrl: IMG.cross,
      featured: false,
      published: true,
    },

    // ── Apologetics Sessions ──────────────────────────────────────────────────
    {
      title: 'University of Nairobi — Did Jesus Rise From the Dead?',
      description: 'An apologetics session delivered to philosophy students at the University of Nairobi, examining the historical evidence for the resurrection.',
      content: 'Delivered to undergraduate philosophy students at the University of Nairobi. The argument proceeds via the "minimal facts" accepted by virtually all critical historians: the empty tomb, post-resurrection appearances, and the disciples\' willingness to die for their belief. The resurrection hypothesis outperforms all rival explanations.',
      type: ResourceType.SESSION,
      category: ResourceCategory.RESURRECTION,
      tags: ['resurrection', 'history', 'University of Nairobi', 'minimal facts'],
      thumbnailUrl: IMG.uon,
      featured: true,
      published: true,
    },
    {
      title: 'Kabarak University — Is Christianity Rational?',
      description: 'An apologetics session at Kabarak University exploring the rationality of Christian belief in the face of scientific and philosophical challenges.',
      content: 'Delivered at Kabarak University in Nakuru. This session addresses one of the most common objections from university students: that Christianity requires blind faith and is incompatible with reason and science. Dr. Njoroge demonstrates that not only is Christianity rational, but that the Christian worldview provides the best foundation for rationality itself.',
      type: ResourceType.SESSION,
      category: ResourceCategory.EXISTENCE_OF_GOD,
      tags: ['rationality', 'Kabarak', 'faith and reason', 'science'],
      thumbnailUrl: LOCAL.kabarak,
      featured: true,
      published: true,
    },
    {
      title: 'Strathmore University — Truth in a Postmodern World',
      description: 'An apologetics session exploring postmodern relativism and the Christian claim that Jesus is "the way, the truth, and the life."',
      content: 'Postmodernism\'s central claim — that there is no objective truth — is self-defeating. This session at Strathmore University examines: (1) What postmodernism actually claims, (2) Why the critique is self-refuting, and (3) How the Christian view of truth grounds knowledge, ethics, and meaning.',
      type: ResourceType.SESSION,
      category: ResourceCategory.POSTMODERNISM,
      tags: ['postmodernism', 'truth', 'Strathmore', 'relativism', 'current topic'],
      thumbnailUrl: IMG.strathmore,
      featured: true,
      published: true,
    },
    {
      title: 'Muslim-Christian Dialogue — Responding to Islamic Objections',
      description: 'A structured apologetics session examining key Islamic challenges: the Trinity, Bible reliability, and the crucifixion.',
      content: 'This session addresses three major Islamic objections to Christianity: (1) Is the doctrine of the Trinity polytheism? (2) Has the Bible been corrupted? (3) Did Jesus really die on the cross? Each objection is examined fairly with a rigorous Christian response.',
      type: ResourceType.SESSION,
      category: ResourceCategory.ISLAM,
      tags: ['Islam', 'dialogue', 'Trinity', 'crucifixion', 'interfaith'],
      thumbnailUrl: IMG.africa,
      featured: false,
      published: true,
    },

    // ── Articles ──────────────────────────────────────────────────────────────
    {
      title: 'The Kalam Cosmological Argument',
      description: 'A rigorous examination of the cosmological argument for God\'s existence and why it matters for African Christians.',
      content: 'The Kalam Cosmological Argument: (1) Everything that begins to exist has a cause; (2) The universe began to exist; (3) Therefore, the universe has a cause. This cause must be uncaused, timeless, spaceless, and personal — the classical attributes of God.',
      type: ResourceType.ARTICLE,
      category: ResourceCategory.EXISTENCE_OF_GOD,
      tags: ['cosmology', 'philosophy', 'Kalam', 'existence of God'],
      thumbnailUrl: IMG.cosmos,
      featured: true,
      published: true,
    },
    {
      title: 'Is the Bible Historically Reliable?',
      description: 'A survey of archaeological and textual evidence supporting the historical reliability of Scripture.',
      content: 'The manuscript tradition of the New Testament is unmatched in the ancient world — over 5,800 Greek manuscripts. Archaeology has confirmed hundreds of details once considered legendary. No other ancient document compares to the NT in manuscript quantity, quality, and proximity to the events described.',
      type: ResourceType.ARTICLE,
      category: ResourceCategory.BIBLE_RELIABILITY,
      tags: ['Bible', 'archaeology', 'manuscripts', 'history'],
      bookOfBible: 'General',
      thumbnailUrl: IMG.openbook,
      featured: true,
      published: true,
    },
    {
      title: 'The Moral Argument for God',
      description: 'If God does not exist, objective moral values do not exist. But they clearly do — therefore God exists.',
      content: 'The moral argument: (1) If God does not exist, objective moral values do not exist; (2) Objective moral values do exist; (3) Therefore, God exists. Without a transcendent moral lawgiver, moral values reduce to subjective preferences or evolutionary byproducts.',
      type: ResourceType.ARTICLE,
      category: ResourceCategory.MORALITY,
      tags: ['morality', 'ethics', 'philosophy', 'C.S. Lewis'],
      thumbnailUrl: IMG.philosophy,
      featured: false,
      published: true,
    },

    // ── Podcast ───────────────────────────────────────────────────────────────
    {
      title: 'Why I Believe — The Personal Faith of an African Apologist',
      description: 'Rev. Dr. Njoroge shares his journey from doubt to confident Christian faith and why apologetics changed his life.',
      type: ResourceType.PODCAST,
      category: ResourceCategory.GENERAL,
      tags: ['testimony', 'faith', 'personal', 'podcast'],
      thumbnailUrl: IMG.podcast,
      featured: false,
      published: true,
    },

    // ── Book ──────────────────────────────────────────────────────────────────
    {
      title: 'Reasonable Faith — William Lane Craig',
      description: 'The definitive introduction to Christian apologetics. Covers the existence of God, the resurrection, and the reliability of the Gospels.',
      type: ResourceType.BOOK,
      category: ResourceCategory.EXISTENCE_OF_GOD,
      tags: ['book', 'William Lane Craig', 'philosophy', 'theology'],
      externalUrl: 'https://www.amazon.com/Reasonable-Faith-Christian-Truth-Apologetics/dp/1433501155',
      thumbnailUrl: IMG.library,
      featured: false,
      published: true,
    },
  ];

  for (const r of resourceSeeds) {
    try {
      await resources.create(r as any, admin?.id);
      console.log(`✓ ${r.type}: ${r.title.substring(0, 60)}`);
    } catch (e: any) {
      console.log(`  (skipped: ${r.title.substring(0, 50)}) — ${e.message}`);
    }
  }

  // ─── Blog posts ────────────────────────────────────────────────────────────
  const postSeeds = [
    {
      title: 'Truth and Postmodernism: Why This Conversation Matters Now',
      excerpt: 'Our current Saturday discussion series tackles one of the most pressing intellectual challenges facing Christians today — the postmodern denial of objective truth.',
      content: 'Postmodernism is no longer just an academic philosophy discussed in university seminars. It has filtered into everyday language, culture, and increasingly into the church itself.\n\n"Your truth is your truth." "Who are you to say what\'s right for someone else?" These are the phrases of everyday postmodernism.\n\nAt our Saturday sessions this quarter, we are working through what postmodernism actually claims, whether those claims are coherent, and how the Christian gospel speaks directly to this challenge.\n\nJoin us every second and fourth Saturday at 7:00 PM EAT.',
      coverImageUrl: IMG.philosophy,
      tags: ['postmodernism', 'truth', 'Saturday sessions', 'current topic'],
      featured: true,
      published: true,
    },
    {
      title: 'Why Apologetics Matters in Africa',
      excerpt: 'The African church faces unique intellectual challenges. Here is why equipping believers with good answers is more important than ever.',
      content: 'Christianity in Africa is growing at a remarkable pace. But growth in numbers does not always mean growth in depth.\n\nMany African Christians are encountering questions they have never been prepared to answer — from secular universities, from Muslim neighbors, from family members who have left the faith.\n\nThis is why apologetics matters. Not as an academic exercise, but as pastoral necessity. When a young Christian at the University of Nairobi is told by her philosophy professor that belief in God is irrational, she needs more than "just have faith." She needs reasons.',
      coverImageUrl: IMG.africa,
      tags: ['apologetics', 'Africa', 'church', 'faith'],
      featured: false,
      published: true,
    },
    {
      title: 'Islam and Christianity: Understanding the Key Differences',
      excerpt: 'A fair and respectful comparison of the central claims of Islam and Christianity for East African Christians.',
      content: 'Both Islam and Christianity claim to be the true religion of Abraham. Both have deep roots in African history and culture. Both are growing rapidly across the continent.\n\nBut the differences between these two faiths are profound — in the nature of God (Trinity vs strict monotheism), the identity of Jesus (Lord and Savior vs prophet), and the path to salvation (grace vs works).',
      coverImageUrl: IMG.discussion,
      tags: ['Islam', 'comparison', 'dialogue', 'interfaith'],
      featured: false,
      published: true,
    },
    {
      title: 'Answering the Problem of Evil',
      excerpt: 'If God is good and all-powerful, why is there so much suffering in the world? This ancient question has better answers than you might think.',
      content: 'The problem of evil is perhaps the most emotionally powerful argument against the existence of God.\n\nAlvin Plantinga\'s Free Will Defense showed conclusively that no logical contradiction exists between God\'s existence and the presence of evil. The evidential problem remains a challenge, but must be weighed against the powerful evidence for God from cosmology, fine-tuning, and the resurrection.',
      coverImageUrl: IMG.cross,
      tags: ['suffering', 'theodicy', 'problem of evil', 'Plantinga'],
      featured: false,
      published: true,
    },
  ];

  for (const p of postSeeds) {
    try {
      await blog.create(p as any, admin?.id);
      console.log(`✓ Blog: ${p.title.substring(0, 60)}`);
    } catch (e: any) {
      console.log(`  (skipped: ${p.title.substring(0, 50)}) — ${e.message}`);
    }
  }

  // ─── Q&A ───────────────────────────────────────────────────────────────────
  const questionSeeds = [
    {
      title: 'How do we know God exists? What is the strongest philosophical argument?',
      body: 'I have been debating this with my university classmates and would love a clear, philosophical answer.',
      askerName: 'Kwame A.',
      askerEmail: 'kwame@example.com',
      tags: ['existence of God', 'philosophy', 'Kalam'],
      answer: 'The strongest argument is the Kalam Cosmological Argument: (1) Everything that begins to exist has a cause; (2) The universe began to exist; (3) Therefore, the universe has a cause.\n\nThis cause must be uncaused, timeless, spaceless, immensely powerful, and personal — the classical attributes of God. The Big Bang, the second law of thermodynamics, and the Borde-Guth-Vilenkin theorem all confirm that the universe had an absolute beginning.\n\nAdditionally, the fine-tuning of the universe\'s constants provides a powerful teleological argument — physicists estimate the odds of the constants being what they are by chance at 1 in 10^10^123.',
      featured: true,
    },
    {
      title: 'Did Jesus actually rise from the dead, or did the disciples make it up?',
      body: 'My friend says the resurrection is a myth created by early Christians to give their movement momentum after Jesus was executed.',
      askerName: 'Amara O.',
      askerEmail: 'amara@example.com',
      tags: ['resurrection', 'history', 'Jesus'],
      answer: 'Three facts are accepted by virtually all critical historians — including sceptics:\n\n1. Jesus\' tomb was found empty on the third day.\n2. Multiple individuals and groups reported seeing Jesus alive after his death.\n3. The disciples were so convinced they were willing to die for it — not for something they knew was a lie.\n\nThe resurrection hypothesis alone explains all three facts with explanatory power and scope. Hallucination theories don\'t account for the empty tomb. Theft theories don\'t account for the appearances. The evidence is remarkably strong.',
      featured: true,
    },
    {
      title: 'How should Christians respond to postmodern claims that truth is relative?',
      body: 'At my university almost everyone says "your truth is your truth." How do I respond?',
      askerName: 'Cynthia M.',
      askerEmail: 'cynthia@example.com',
      tags: ['postmodernism', 'truth', 'relativism', 'university'],
      answer: 'The postmodern claim that "truth is relative" is self-defeating. Ask: "Is that claim itself objectively true, or just true for you?" If truth is merely relative, then the claim that truth is relative is only relatively true — and we can simply choose not to accept it.\n\nFurthermore, postmodern relativism cannot be consistently lived. The person who says "your truth is your truth" still checks whether the bridge is structurally sound before crossing it.\n\nThe Christian answer is that truth is grounded in the nature of God — who is Truth itself (John 14:6).',
      featured: false,
    },
  ];

  for (const q of questionSeeds) {
    try {
      const saved = await questions.submit({
        title: q.title, body: q.body,
        askerName: q.askerName, askerEmail: q.askerEmail,
        tags: q.tags, anonymous: false,
      });
      await questions.answer(saved.id, { answer: q.answer, featured: q.featured, tags: q.tags }, admin?.id);
      console.log(`✓ Q&A: ${q.title.substring(0, 55)}…`);
    } catch (e: any) {
      console.log(`  (skipped Q&A) — ${e.message}`);
    }
  }

  console.log('\n✅ Seed complete!');
  await app.close();
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
