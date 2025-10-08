import { prisma } from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, skills: true },
    });
    return res.status(200).json({
      userName: user?.name || null,
      profile: user?.profile || null,
      skills: user?.skills?.map(s => ({ id: s.id, name: s.name })) || [],
    });
  } catch (e) {
    console.error('getProfile error:', e);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

export const upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, avatarUrl, jobTitle, selectedSkills, education, experiences, achievements, projects, links, headline, bio,
      companyName, companyWebsite, companySize, industry, location, logoUrl, aboutCompany, hiringNeeds, contact } = req.body;

    // Basic validation/coercion to avoid Prisma/DB errors on unexpected shapes
    const safeArray = (v, fallback = []) => Array.isArray(v) ? v : fallback;
    const safeObject = (v, fallback = {}) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : fallback;
    const safeStringOrNull = (v) => (typeof v === 'string' && v.trim() !== '') ? v.trim() : null;

    const pruneObject = (obj) => {
      const o = safeObject(obj, {});
      const out = {};
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string') {
          const val = v.trim();
          if (val) out[k] = val;
        } else if (Array.isArray(v)) {
          if (v.length) out[k] = v;
        } else if (v && typeof v === 'object') {
          const nested = pruneObject(v);
          if (Object.keys(nested).length) out[k] = nested;
        } else if (v != null) {
          out[k] = v;
        }
      }
      return out;
    };

    const filterArrayOfRecords = (arr, keys) => safeArray(arr, []).filter(item => {
      if (!item || typeof item !== 'object') return false;
      // keep if any of the keys has a non-empty string
      return keys.some(k => typeof item[k] === 'string' ? item[k].trim() !== '' : !!item[k]);
    });

    const dataPayload = {
      avatarUrl: safeStringOrNull(avatarUrl),
      jobTitle: safeStringOrNull(jobTitle),
      education: filterArrayOfRecords(education, ['institution','level','certificateUrl']),
      experiences: filterArrayOfRecords(experiences, ['company','title','duration','description']),
      achievements: filterArrayOfRecords(achievements, ['text','link']),
      projects: filterArrayOfRecords(projects, ['description','liveDemo','github']),
      links: pruneObject(links),
      headline: safeStringOrNull(headline),
      bio: typeof bio === 'string' ? bio : null,
      // Employer fields (remain null when not provided)
      companyName: safeStringOrNull(companyName),
      companyWebsite: safeStringOrNull(companyWebsite),
      companySize: safeStringOrNull(companySize),
      industry: safeStringOrNull(industry),
      location: safeStringOrNull(location),
      logoUrl: safeStringOrNull(logoUrl),
      aboutCompany: typeof aboutCompany === 'string' ? aboutCompany : null,
      hiringNeeds: safeArray(hiringNeeds, [])
        .map(h => ({ role: (h?.role || '').toString().trim(), count: Math.max(1, parseInt(h?.count || 1, 10) || 1) }))
        .filter(h => h.role.length > 0),
      contact: pruneObject(contact),
    };

    // Update user name if provided
    if (fullName) {
      await prisma.user.update({ where: { id: userId }, data: { name: fullName } });
    }

    // Upsert profile JSON fields
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: dataPayload,
      create: { userId, ...dataPayload },
    });

    // Handle skills: ensure exist then set relation (max 15)
    let skills = [];
    if (req.user.role !== 'CLIENT') {
      let skillNames = Array.isArray(selectedSkills) ? selectedSkills.slice(0, 15) : [];
      // sanitize and dedupe skills
      skillNames = Array.from(new Set(skillNames
        .map(s => typeof s === 'string' ? s.trim() : '')
        .filter(s => s.length > 0)));
      // create missing skills
      await Promise.all(skillNames.map(async (name) => {
        try { await prisma.skill.upsert({ where: { name }, update: {}, create: { name } }); } catch {}
      }));
      skills = await prisma.skill.findMany({ where: { name: { in: skillNames } } });
      await prisma.user.update({
        where: { id: userId },
        data: { skills: { set: [], connect: skills.map(s => ({ id: s.id })) } },
      });
    }

    return res.status(200).json({ message: 'Profile saved', profile, skills: skills.map(s=>({id:s.id,name:s.name})) });
  } catch (e) {
    console.error('upsertProfile error:', e);
    const details = e?.code ? { code: e.code, meta: e.meta } : undefined;
    return res.status(500).json({ message: 'Failed to save profile', ...(details && { details }) });
  }
};

export const listMockSkills = async (_req, res) => {
  const skills = [
    'Web Development','JavaScript','TypeScript','React','Node.js','Express','Python','Django','Flask','FastAPI',
    'Java','Spring','C#','ASP.NET','Go','Rust','SQL','PostgreSQL','MongoDB','GraphQL',
    'DevOps','Docker','Kubernetes','AWS','Azure','GCP','Machine Learning','Deep Learning','Data Science'
  ];
  return res.status(200).json({ skills });
};
