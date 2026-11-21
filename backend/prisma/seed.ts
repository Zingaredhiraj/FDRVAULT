import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const TODAY = new Date('2026-10-26T00:00:00.000Z');

function daysFromToday(days: number): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

function calcMaturityAmount(principal: bigint, rate: number, months: number, type: string): bigint {
  const P = Number(principal);
  const n = months / 12;
  if (type === 'CUMULATIVE') {
    return BigInt(Math.round(P * Math.pow(1 + rate / 400, 4 * n)));
  }
  return principal;
}

async function hashPwd(p: string) {
  return bcrypt.hash(p, 12);
}

// Create a minimal valid PDF buffer
function createMinimalPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (AICTE FDR Document) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
367
%%EOF`;
  return Buffer.from(content);
}

const STATES = [
  'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Uttar Pradesh', 'Gujarat',
  'Rajasthan', 'Andhra Pradesh', 'Telangana', 'West Bengal', 'Madhya Pradesh',
  'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Kerala',
];

const INST_TYPES = [
  'Engineering', 'Management', 'Pharmacy', 'Architecture', 'MCA',
  'MBA', 'Hotel Management', 'Applied Arts', 'Other',
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up in correct dependency order
  await prisma.alertLog.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.releaseStep.deleteMany();
  await prisma.releaseRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fdr.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.systemSetting.deleteMany();

  // System settings
  await prisma.systemSetting.create({
    data: {
      key: 'nearMaturityDays',
      value: '90',
      description: 'Days before maturity to mark FDR as NEAR_MATURITY',
    },
  });

  // Banks
  const bankData = [
    { name: 'State Bank of India', shortCode: 'SBI' },
    { name: 'Punjab National Bank', shortCode: 'PNB' },
    { name: 'Canara Bank', shortCode: 'CANARA' },
    { name: 'Bank of Baroda', shortCode: 'BOB' },
    { name: 'Union Bank of India', shortCode: 'UNION' },
    { name: 'HDFC Bank', shortCode: 'HDFC' },
    { name: 'ICICI Bank', shortCode: 'ICICI' },
    { name: 'Axis Bank', shortCode: 'AXIS' },
    { name: 'Kotak Mahindra Bank', shortCode: 'KOTAK' },
    { name: 'IDBI Bank', shortCode: 'IDBI' },
    { name: 'Indian Bank', shortCode: 'INDBN' },
    { name: 'Bank of India', shortCode: 'BOI' },
  ];
  const banks = await Promise.all(bankData.map(b => prisma.bank.create({ data: b })));
  console.log(`✅ Created ${banks.length} banks`);

  const isClean = process.argv.includes('--clean') || process.env.CLEAN_START === 'true' || process.env.CLEAN_DB === 'true';
  if (isClean) {
    const pwd = await hashPwd('Demo@1234');
    await prisma.user.createMany({
      data: [
        { email: 'admin@aicte.gov.in', passwordHash: pwd, role: 'SUPER_ADMIN', name: 'Dr. R. K. Sharma (Director e-Governance)', phone: '011-29581001' },
        { email: 'finance@aicte.gov.in', passwordHash: pwd, role: 'FINANCE_OFFICER', name: 'Smt. Ananya Sen (Chief Finance Officer)', phone: '011-29581002' },
        { email: 'verifier@aicte.gov.in', passwordHash: pwd, role: 'VERIFIER', name: 'Shri Vikram Malhotra (Assistant Scrutiny Officer)', phone: '011-29581003' },
        { email: 'authority@aicte.gov.in', passwordHash: pwd, role: 'APPROVING_AUTHORITY', name: 'Prof. Rajive Kumar (Member Secretary, AICTE)', phone: '011-29581004' },
        { email: 'auditor@cag.gov.in', passwordHash: pwd, role: 'AUDITOR', name: 'Shri Arvind Rao (Principal Director of Audit, CAG)', phone: '011-23235678' },
        { email: 'admin@aicte.demo', passwordHash: pwd, role: 'SUPER_ADMIN', name: 'Super Admin', phone: '9000000001' },
        { email: 'finance@aicte.demo', passwordHash: pwd, role: 'FINANCE_OFFICER', name: 'Finance Officer', phone: '9000000002' },
        { email: 'verifier@aicte.demo', passwordHash: pwd, role: 'VERIFIER', name: 'Verifier User', phone: '9000000003' },
        { email: 'authority@aicte.demo', passwordHash: pwd, role: 'APPROVING_AUTHORITY', name: 'Approving Authority', phone: '9000000004' },
        { email: 'auditor@aicte.demo', passwordHash: pwd, role: 'AUDITOR', name: 'Auditor User', phone: '9000000006' },
      ],
    });
    console.log('✨ Clean database initialized successfully with zero institutions and zero FDRs.');
    return;
  }

  // Real AICTE-Approved Technical Institutions (40)
  const realInstitutions = [
    {
      aicteId: '1-456123891',
      name: 'College of Engineering, Pune (COEP Technological University)',
      type: 'Engineering',
      state: 'Maharashtra',
      city: 'Pune',
      headName: 'Dr. B. B. Ahuja',
      headEmail: 'director@coep.ac.in',
      phone: '020-25507000',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-398712345',
      name: 'Veermata Jijabai Technological Institute (VJTI Mumbai)',
      type: 'Engineering',
      state: 'Maharashtra',
      city: 'Mumbai',
      headName: 'Dr. Sachin Kore',
      headEmail: 'director@vjti.ac.in',
      phone: '022-24198100',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-109823411',
      name: 'Delhi Technological University (DTU Delhi)',
      type: 'Engineering',
      state: 'Delhi',
      city: 'New Delhi',
      headName: 'Prof. Prateek Sharma',
      headEmail: 'vc@dtu.ac.in',
      phone: '011-27871018',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-582910342',
      name: 'R.V. College of Engineering (RVCE Bengaluru)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Bengaluru',
      headName: 'Dr. K. N. Subramanya',
      headEmail: 'principal@rvce.edu.in',
      phone: '080-68188100',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-294817263',
      name: 'PSG College of Technology',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      headName: 'Dr. K. Prakasan',
      headEmail: 'principal@psgtech.edu',
      phone: '0422-2572177',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-817263541',
      name: 'Thapar Institute of Engineering & Technology',
      type: 'Engineering',
      state: 'Punjab',
      city: 'Patiala',
      headName: 'Dr. Padmakumar Nair',
      headEmail: 'director@thapar.edu',
      phone: '0175-2393021',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-918273645',
      name: 'Birla Institute of Technology, Mesra',
      type: 'Engineering',
      state: 'Jharkhand',
      city: 'Ranchi',
      headName: 'Prof. Indranil Manna',
      headEmail: 'vc@bitmesra.ac.in',
      phone: '0651-2275444',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-726154382',
      name: 'Harcourt Butler Technical University (HBTU Kanpur)',
      type: 'Engineering',
      state: 'Uttar Pradesh',
      city: 'Kanpur',
      headName: 'Prof. Samsher',
      headEmail: 'vc@hbtu.ac.in',
      phone: '0512-2534001',
      approvalStatus: 'APPROVED',
      hasPendingDues: true,
      pendingDuesNote: 'Building safety certificate renewal pending for academic year 2024-25',
    },
    {
      aicteId: '1-635241789',
      name: 'B.M.S. College of Engineering (BMSCE)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Bengaluru',
      headName: 'Dr. S. Muralidhara',
      headEmail: 'principal@bmsce.ac.in',
      phone: '080-26622130',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-546372819',
      name: 'Institute of Chemical Technology (ICT Mumbai)',
      type: 'Pharmacy',
      state: 'Maharashtra',
      city: 'Mumbai',
      headName: 'Prof. Aniruddha Pandit',
      headEmail: 'vc@ictmumbai.edu.in',
      phone: '022-33611111',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-435261782',
      name: 'Jadavpur University Faculty of Engineering',
      type: 'Engineering',
      state: 'West Bengal',
      city: 'Kolkata',
      headName: 'Prof. Chiranjib Bhattacharjee',
      headEmail: 'dean_engg@jadavpuruniversity.in',
      phone: '033-24572227',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-324156789',
      name: 'College of Engineering Guindy (Anna University)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Chennai',
      headName: 'Dr. L. Suganthi',
      headEmail: 'dean_ceg@annauniv.edu',
      phone: '044-22358491',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-213456789',
      name: 'The National Institute of Engineering (NIE Mysuru)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Mysuru',
      headName: 'Dr. Rohini Nagapadma',
      headEmail: 'principal@nie.ac.in',
      phone: '0821-2480475',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-123456789',
      name: 'L.D. College of Engineering (LDCE Ahmedabad)',
      type: 'Engineering',
      state: 'Gujarat',
      city: 'Ahmedabad',
      headName: 'Dr. Rajul K. Gajjar',
      headEmail: 'principal@ldce.ac.in',
      phone: '079-26306752',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-987654321',
      name: 'University College of Engineering, Osmania University',
      type: 'Engineering',
      state: 'Telangana',
      city: 'Hyderabad',
      headName: 'Prof. Sriram Venkatesh',
      headEmail: 'principal@uceou.edu',
      phone: '040-27098254',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-876543210',
      name: 'Andhra University College of Engineering',
      type: 'Engineering',
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',
      headName: 'Prof. P. Mallikarjuna Rao',
      headEmail: 'principal@andhrauniversity.edu.in',
      phone: '0891-2844000',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-765432109',
      name: 'Government College of Technology (GCT Coimbatore)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      headName: 'Dr. K. Manonmani',
      headEmail: 'principal@gct.ac.in',
      phone: '0422-2432221',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-654321098',
      name: 'Sardar Patel College of Engineering (SPCE Mumbai)',
      type: 'Engineering',
      state: 'Maharashtra',
      city: 'Mumbai',
      headName: 'Dr. M. M. Murudi',
      headEmail: 'principal@spce.ac.in',
      phone: '022-26232110',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-543210987',
      name: 'Thiagarajar College of Engineering (TCE Madurai)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Madurai',
      headName: 'Dr. M. Palaninatha Rajan',
      headEmail: 'principal@tce.edu',
      phone: '0452-2482240',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-432109876',
      name: 'Manipal Institute of Technology (MIT Manipal)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Manipal',
      headName: 'Dr. C. S. Murthy',
      headEmail: 'director.mit@manipal.edu',
      phone: '0820-2924012',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-321098765',
      name: 'Kumaraguru College of Technology (KCT Coimbatore)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      headName: 'Dr. D. Saravanan',
      headEmail: 'principal@kct.ac.in',
      phone: '0422-2661100',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-210987654',
      name: 'Chitkara University Institute of Engineering and Technology',
      type: 'Engineering',
      state: 'Punjab',
      city: 'Rajpura',
      headName: 'Dr. Archana Mantri',
      headEmail: 'vc@chitkara.edu.in',
      phone: '01762-507084',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-109876543',
      name: 'Kalinga Institute of Industrial Technology (KIIT Deemed University)',
      type: 'Engineering',
      state: 'Odisha',
      city: 'Bhubaneswar',
      headName: 'Prof. Saranjit Singh',
      headEmail: 'vc@kiit.ac.in',
      phone: '0674-2725113',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-908765432',
      name: 'Amrita School of Engineering (Amrita Vishwa Vidyapeetham)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      headName: 'Dr. Sasangan Ramanathan',
      headEmail: 'dean_engg@amrita.edu',
      phone: '0422-2685000',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-897654321',
      name: 'Vellore Institute of Technology (VIT Vellore)',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Vellore',
      headName: 'Dr. V. S. Kanchana Bhaaskaran',
      headEmail: 'vc@vit.ac.in',
      phone: '0416-2243091',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-786543210',
      name: 'SRM Institute of Science and Technology',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Kattankulathur',
      headName: 'Dr. C. Muthamizhchelvan',
      headEmail: 'vc@srmist.edu.in',
      phone: '044-27455510',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-675432109',
      name: 'SASTRA Deemed to be University',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Thanjavur',
      headName: 'Prof. S. Vaidhyasubramaniam',
      headEmail: 'vc@sastra.edu',
      phone: '04362-264101',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-564321098',
      name: 'Dayananda Sagar College of Engineering (DSCE)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Bengaluru',
      headName: 'Dr. B. G. Prasad',
      headEmail: 'principal@dsce.edu.in',
      phone: '080-42161704',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-453210987',
      name: 'PES University (Ring Road Campus)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Bengaluru',
      headName: 'Dr. J. Suryaprasad',
      headEmail: 'vc@pes.edu',
      phone: '080-26721983',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-342109876',
      name: 'Walchand College of Engineering',
      type: 'Engineering',
      state: 'Maharashtra',
      city: 'Sangli',
      headName: 'Dr. U. A. Dabade',
      headEmail: 'director@walchandsangli.ac.in',
      phone: '0233-2300383',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-231098765',
      name: 'Government Engineering College, Thrissur (GECT)',
      type: 'Engineering',
      state: 'Kerala',
      city: 'Thrissur',
      headName: 'Dr. Ranjini Bhattathiripad',
      headEmail: 'principal@gectcr.ac.in',
      phone: '0487-2334144',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-120987654',
      name: 'Madhav Institute of Technology and Science (MITS)',
      type: 'Engineering',
      state: 'Madhya Pradesh',
      city: 'Gwalior',
      headName: 'Dr. R. K. Pandit',
      headEmail: 'director@mitsgwalior.in',
      phone: '0751-2409300',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-019876543',
      name: 'Shri Govindram Seksaria Institute of Technology and Science (SGSITS)',
      type: 'Engineering',
      state: 'Madhya Pradesh',
      city: 'Indore',
      headName: 'Dr. Rakesh Saxena',
      headEmail: 'director@sgsits.ac.in',
      phone: '0731-2582100',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-987012345',
      name: 'Institute of Engineering and Technology (IET Lucknow)',
      type: 'Engineering',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      headName: 'Prof. Vineet Kansal',
      headEmail: 'director@ietlucknow.ac.in',
      phone: '0522-2733696',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-876901234',
      name: 'Madan Mohan Malaviya University of Technology (MMMUT)',
      type: 'Engineering',
      state: 'Uttar Pradesh',
      city: 'Gorakhpur',
      headName: 'Prof. J. P. Pandey',
      headEmail: 'vc@mmmut.ac.in',
      phone: '0551-2273958',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-765890123',
      name: 'Government Engineering College, Raipur',
      type: 'Engineering',
      state: 'Chhattisgarh',
      city: 'Raipur',
      headName: 'Dr. Y. P. Patel',
      headEmail: 'principal@gecraipur.ac.in',
      phone: '0771-2972963',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-654789012',
      name: 'National Institute of Technology Karnataka (Associated Campus)',
      type: 'Engineering',
      state: 'Karnataka',
      city: 'Surathkal',
      headName: 'Prof. B. Ravi',
      headEmail: 'director@nitk.edu.in',
      phone: '0824-2474000',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-543678901',
      name: 'Government College of Engineering, Salem',
      type: 'Engineering',
      state: 'Tamil Nadu',
      city: 'Salem',
      headName: 'Dr. R. Vijayan',
      headEmail: 'principal@gcesalem.edu.in',
      phone: '0427-2346157',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-432567890',
      name: 'Goa College of Engineering (GEC Farmagudi)',
      type: 'Engineering',
      state: 'Goa',
      city: 'Farmagudi',
      headName: 'Dr. K. G. Guptha',
      headEmail: 'principal@gec.ac.in',
      phone: '0832-2336301',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
    {
      aicteId: '1-321456789',
      name: 'Jamia Hamdard School of Pharmaceutical Education and Research',
      type: 'Pharmacy',
      state: 'Delhi',
      city: 'New Delhi',
      headName: 'Prof. M. A. Jafri',
      headEmail: 'dean_pharmacy@jamiahamdard.ac.in',
      phone: '011-26059688',
      approvalStatus: 'APPROVED',
      hasPendingDues: false,
      pendingDuesNote: null,
    },
  ];

  const institutions = await Promise.all(realInstitutions.map(d => prisma.institution.create({ data: d })));
  console.log(`✅ Created ${institutions.length} institutions`);

  // Users (Official AICTE Personas + Test Compatibility)
  const pwd = await hashPwd('Demo@1234');

  // Official AICTE Authority & Institutional Users
  const adminUser = await prisma.user.create({
    data: { email: 'admin@aicte.gov.in', passwordHash: pwd, role: 'SUPER_ADMIN', name: 'Dr. R. K. Sharma (Director e-Governance)', phone: '011-29581001' },
  });
  const financeUser = await prisma.user.create({
    data: { email: 'finance@aicte.gov.in', passwordHash: pwd, role: 'FINANCE_OFFICER', name: 'Smt. Ananya Sen (Chief Finance Officer)', phone: '011-29581002' },
  });
  const verifierUser = await prisma.user.create({
    data: { email: 'verifier@aicte.gov.in', passwordHash: pwd, role: 'VERIFIER', name: 'Shri Vikram Malhotra (Assistant Scrutiny Officer)', phone: '011-29581003' },
  });
  const authorityUser = await prisma.user.create({
    data: { email: 'authority@aicte.gov.in', passwordHash: pwd, role: 'APPROVING_AUTHORITY', name: 'Prof. Rajive Kumar (Member Secretary, AICTE)', phone: '011-29581004' },
  });
  const instUser = await prisma.user.create({
    data: {
      email: 'director@coep.ac.in',
      passwordHash: pwd,
      role: 'INSTITUTION_USER',
      name: 'Dr. B. B. Ahuja (Director, COEP Technological Univ)',
      phone: '020-25507000',
      institutionId: institutions[0].id,
    },
  });
  const auditorUser = await prisma.user.create({
    data: { email: 'auditor@cag.gov.in', passwordHash: pwd, role: 'AUDITOR', name: 'Shri Arvind Rao (Principal Director of Audit, CAG)', phone: '011-23235678' },
  });

  // Backward compatibility user accounts for automated vitest test suites
  await prisma.user.createMany({
    data: [
      { email: 'admin@aicte.demo', passwordHash: pwd, role: 'SUPER_ADMIN', name: 'Super Admin', phone: '9000000001' },
      { email: 'finance@aicte.demo', passwordHash: pwd, role: 'FINANCE_OFFICER', name: 'Finance Officer', phone: '9000000002' },
      { email: 'verifier@aicte.demo', passwordHash: pwd, role: 'VERIFIER', name: 'Verifier User', phone: '9000000003' },
      { email: 'authority@aicte.demo', passwordHash: pwd, role: 'APPROVING_AUTHORITY', name: 'Approving Authority', phone: '9000000004' },
      { email: 'institution@aicte.demo', passwordHash: pwd, role: 'INSTITUTION_USER', name: 'Institution User', phone: '9000000005', institutionId: institutions[0].id },
      { email: 'auditor@aicte.demo', passwordHash: pwd, role: 'AUDITOR', name: 'Auditor User', phone: '9000000006' },
    ],
  });
  console.log(`✅ Created 12 users (6 official government/institution personas + 6 test aliases)`);

  const uploadBase = path.join(process.cwd(), 'uploads');
  const releasesDir = path.join(uploadBase, 'releases');
  fs.mkdirSync(releasesDir, { recursive: true });

  const pdfBuffer = createMinimalPdf();
  const purposes = ['APPROVAL_PROCESS_FEE', 'SECURITY_DEPOSIT', 'PERFORMANCE_GUARANTEE', 'OTHER'];
  const interestTypes = ['CUMULATIVE', 'QUARTERLY_PAYOUT'];

  const fdrList: { id: string; status: string; institutionId: string; maturityAmount: bigint }[] = [];
  let fdrNum = 1;

  function ensureInstDir(institutionId: string) {
    const dir = path.join(uploadBase, institutionId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async function createDocForFdr(fdrId: string, institutionId: string, docType: string, status: string) {
    const dir = ensureInstDir(institutionId);
    const filename = `${fdrId}-${docType}-v1.pdf`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdfBuffer);
    return prisma.document.create({
      data: {
        fdrId,
        documentType: docType,
        fileName: filename,
        originalName: `${docType.toLowerCase().replace(/_/g, '-')}.pdf`,
        mimeType: 'application/pdf',
        filePath,
        fileSize: pdfBuffer.length,
        version: 1,
        verificationStatus: status,
        uploadedById: financeUser.id,
        verifiedById: status !== 'PENDING' ? verifierUser.id : null,
        verifiedAt: status !== 'PENDING' ? new Date() : null,
        verificationRemarks: status === 'REJECTED' ? 'Document quality insufficient, please re-upload.' : null,
      },
    });
  }

  async function createFdrEntry(params: {
    institutionIdx: number;
    bankIdx: number;
    issueDate: Date;
    tenureMonths: number;
    principal: bigint;
    rate: number;
    status: string;
    purpose: string;
    interestType: string;
    academicYear: string;
    lienMarked: boolean;
    parentFdrId?: string;
    overrideMaturityDate?: Date;
  }) {
    const institution = institutions[params.institutionIdx % institutions.length];
    const bank = banks[params.bankIdx % banks.length];
    const matDate = params.overrideMaturityDate || addMonths(params.issueDate, params.tenureMonths);
    const matAmount = calcMaturityAmount(params.principal, params.rate, params.tenureMonths, params.interestType);
    const year = 2021 + ((params.institutionIdx + fdrNum) % 4);
    const fdrNumber = `${bank.shortCode}/FDR/${year}/${String(100000 + fdrNum++).slice(-6)}`;
    const shortCode = bank.shortCode.padEnd(4, 'X').slice(0, 4).toUpperCase();
    const branch = `${bank.name}, Commercial Branch, ${institution.city}`;
    const ifsc = `${shortCode}000${String(1000 + (params.bankIdx * 50) + (params.institutionIdx % 20)).slice(-4)}`;

    return prisma.fdr.create({
      data: {
        fdrNumber,
        institutionId: institution.id,
        bankId: bank.id,
        branch,
        ifsc,
        principal: params.principal,
        interestRate: params.rate,
        interestType: params.interestType,
        issueDate: params.issueDate,
        tenureMonths: params.tenureMonths,
        maturityDate: matDate,
        maturityAmount: matAmount,
        quarterlyPayout: params.interestType === 'QUARTERLY_PAYOUT'
          ? BigInt(Math.round(Number(params.principal) * params.rate / 400))
          : BigInt(0),
        lienMarked: params.lienMarked,
        purpose: params.purpose,
        academicYear: params.academicYear,
        status: params.status,
        createdById: financeUser.id,
        parentFdrId: params.parentFdrId,
      },
    });
  }

  // 8 maturing within 7 days
  for (let i = 0; i < 8; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i,
      bankIdx: i,
      issueDate: addMonths(daysFromToday(i + 1 - 24 * 30 / 30), 0), // approximate
      tenureMonths: 24,
      principal: BigInt((100 + i * 50) * 10000000),
      rate: 6.5 + i * 0.1,
      status: 'NEAR_MATURITY',
      purpose: purposes[i % 4],
      interestType: interestTypes[i % 2],
      academicYear: '2024-25',
      lienMarked: true,
      overrideMaturityDate: daysFromToday(i + 1),
    });
    await createDocForFdr(fdr.id, fdr.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'LIEN_LETTER', 'VERIFIED');
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // 15 maturing within 30 days (but > 7)
  for (let i = 0; i < 15; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i + 8,
      bankIdx: i % 12,
      issueDate: addMonths(daysFromToday(8 + i), 0),
      tenureMonths: 12,
      principal: BigInt((200 + i * 30) * 10000000),
      rate: 7.0 + i * 0.05,
      status: 'NEAR_MATURITY',
      purpose: purposes[i % 4],
      interestType: interestTypes[i % 2],
      academicYear: '2024-25',
      lienMarked: true,
      overrideMaturityDate: daysFromToday(8 + i),
    });
    await createDocForFdr(fdr.id, fdr.institutionId, 'FDR_SCAN', i % 3 === 0 ? 'PENDING' : 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'LIEN_LETTER', i % 4 === 0 ? 'REJECTED' : 'VERIFIED');
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // 20 maturing within 90 days (but > 30)
  for (let i = 0; i < 20; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i % 40,
      bankIdx: (i + 3) % 12,
      issueDate: addMonths(daysFromToday(31 + i), 0),
      tenureMonths: 18,
      principal: BigInt((150 + i * 25) * 10000000),
      rate: 6.8,
      status: 'NEAR_MATURITY',
      purpose: purposes[i % 4],
      interestType: interestTypes[i % 2],
      academicYear: '2024-25',
      lienMarked: i % 3 === 0,
      overrideMaturityDate: daysFromToday(31 + i),
    });
    await createDocForFdr(fdr.id, fdr.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'BANK_CONFIRMATION', i % 2 === 0 ? 'PENDING' : 'VERIFIED');
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // 10 overdue (MATURED, past maturity)
  const maturedFdrs: { id: string; status: string; institutionId: string; maturityAmount: bigint }[] = [];
  for (let i = 0; i < 10; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i + 5,
      bankIdx: i % 12,
      issueDate: daysFromToday(-730 - 30 - i * 10),
      tenureMonths: 24,
      principal: BigInt((300 + i * 50) * 10000000),
      rate: 7.5,
      status: 'MATURED',
      purpose: 'SECURITY_DEPOSIT',
      interestType: 'CUMULATIVE',
      academicYear: '2023-24',
      lienMarked: true,
      overrideMaturityDate: daysFromToday(-(30 + i * 10)),
    });
    await createDocForFdr(fdr.id, fdr.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'LIEN_LETTER', 'VERIFIED');
    maturedFdrs.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // 15 RENEWED chains
  for (let i = 0; i < 15; i++) {
    const parentMaturity = daysFromToday(-60 - i);
    const parent = await createFdrEntry({
      institutionIdx: i,
      bankIdx: i % 12,
      issueDate: daysFromToday(-60 - i - 1095),
      tenureMonths: 36,
      principal: BigInt((200 + i * 20) * 10000000),
      rate: 6.5,
      status: 'RENEWED',
      purpose: 'SECURITY_DEPOSIT',
      interestType: 'CUMULATIVE',
      academicYear: '2022-23',
      lienMarked: true,
      overrideMaturityDate: parentMaturity,
    });
    await createDocForFdr(parent.id, parent.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(parent.id, parent.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(parent.id, parent.institutionId, 'LIEN_LETTER', 'VERIFIED');

    const child = await createFdrEntry({
      institutionIdx: i,
      bankIdx: i % 12,
      issueDate: parentMaturity,
      tenureMonths: 24,
      principal: BigInt((200 + i * 20) * 10000000),
      rate: 7.0,
      status: 'ACTIVE',
      purpose: 'SECURITY_DEPOSIT',
      interestType: 'CUMULATIVE',
      academicYear: '2024-25',
      lienMarked: true,
      parentFdrId: parent.id,
    });
    await createDocForFdr(child.id, child.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(child.id, child.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(child.id, child.institutionId, 'LIEN_LETTER', 'VERIFIED');
    fdrList.push(
      { id: parent.id, status: parent.status, institutionId: parent.institutionId, maturityAmount: parent.maturityAmount },
      { id: child.id, status: child.status, institutionId: child.institutionId, maturityAmount: child.maturityAmount },
    );
  }

  // 10 RELEASED
  const releasedFdrs: { id: string; status: string; institutionId: string; maturityAmount: bigint }[] = [];
  for (let i = 0; i < 10; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i + 2,
      bankIdx: i % 12,
      issueDate: daysFromToday(-150 - i - 730),
      tenureMonths: 24,
      principal: BigInt((250 + i * 30) * 10000000),
      rate: 7.25,
      status: 'RELEASED',
      purpose: 'PERFORMANCE_GUARANTEE',
      interestType: 'CUMULATIVE',
      academicYear: '2023-24',
      lienMarked: false,
      overrideMaturityDate: daysFromToday(-120 - i),
    });
    await createDocForFdr(fdr.id, fdr.institutionId, 'FDR_SCAN', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'BANK_CONFIRMATION', 'VERIFIED');
    await createDocForFdr(fdr.id, fdr.institutionId, 'LIEN_LETTER', 'VERIFIED');
    releasedFdrs.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // Fill to 120+: 30 ACTIVE FDRs
  for (let i = 0; i < 30; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i % 40,
      bankIdx: i % 12,
      issueDate: daysFromToday(-(365 - 90 - i * 3)),
      tenureMonths: 12,
      principal: BigInt((100 + i * 10) * 10000000),
      rate: 6.0 + (i % 5) * 0.25,
      status: 'ACTIVE',
      purpose: purposes[i % 4],
      interestType: interestTypes[i % 2],
      academicYear: '2025-26',
      lienMarked: i % 4 === 0,
    });
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  // 5 CLOSED
  for (let i = 0; i < 5; i++) {
    const fdr = await createFdrEntry({
      institutionIdx: i,
      bankIdx: i % 12,
      issueDate: daysFromToday(-565),
      tenureMonths: 12,
      principal: BigInt(10000000000),
      rate: 6.0,
      status: 'CLOSED',
      purpose: 'OTHER',
      interestType: 'CUMULATIVE',
      academicYear: '2023-24',
      lienMarked: false,
      overrideMaturityDate: daysFromToday(-200),
    });
    fdrList.push({ id: fdr.id, status: fdr.status, institutionId: fdr.institutionId, maturityAmount: fdr.maturityAmount });
  }

  console.log(`✅ Created ${fdrList.length} FDRs`);

  // Release requests (10 across workflow states)
  const rrStatuses = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'RELEASED', 'DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'RELEASED'];
  const fdrsForRelease = [...maturedFdrs.slice(0, 5), ...releasedFdrs.slice(0, 5)];

  for (let i = 0; i < 10; i++) {
    const fdrForRelease = fdrsForRelease[i];
    const status = rrStatuses[i];
    const fyStart = 2025;
    const refNum = `AICTE/FDR/REL/${fyStart}/${String(i + 1).padStart(6, '0')}`;

    const rrData: {
      fdrId: string;
      referenceNumber: string;
      status: string;
      prematureRelease: boolean;
      createdById: string;
      releaseDate?: Date;
      utr?: string;
      releasedAmount?: bigint;
      deductions: bigint;
    } = {
      fdrId: fdrForRelease.id,
      referenceNumber: refNum,
      status,
      prematureRelease: false,
      createdById: financeUser.id,
      deductions: BigInt(0),
    };

    if (status === 'RELEASED') {
      rrData.releaseDate = daysFromToday(-30 - i);
      rrData.utr = `UTR${20261026}${String(i).padStart(4, '0')}`;
      rrData.releasedAmount = fdrForRelease.maturityAmount;
    }

    const rr = await prisma.releaseRequest.create({ data: rrData });

    const stepActions: Record<string, string[]> = {
      DRAFT: ['CREATED'],
      SUBMITTED: ['CREATED', 'SUBMITTED'],
      VERIFIED: ['CREATED', 'SUBMITTED', 'VERIFIED'],
      APPROVED: ['CREATED', 'SUBMITTED', 'VERIFIED', 'APPROVED'],
      RELEASED: ['CREATED', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'RELEASED'],
    };

    for (const action of stepActions[status] || ['CREATED']) {
      await prisma.releaseStep.create({
        data: {
          releaseRequestId: rr.id,
          actorId: action === 'VERIFIED' ? verifierUser.id : action === 'APPROVED' ? authorityUser.id : financeUser.id,
          actorRole: action === 'VERIFIED' ? 'VERIFIER' : action === 'APPROVED' ? 'APPROVING_AUTHORITY' : 'FINANCE_OFFICER',
          action,
        },
      });
    }
  }
  console.log(`✅ Created 10 release requests`);

  // Audit logs
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: 'LOGIN', entity: 'User', entityId: adminUser.id, ipAddress: '127.0.0.1' },
      {
        userId: financeUser.id,
        action: 'CREATE',
        entity: 'Fdr',
        entityId: fdrList[0]?.id,
        newValue: JSON.stringify({ fdrNumber: `FDR-000001` }),
        ipAddress: '127.0.0.1',
      },
      { userId: verifierUser.id, action: 'VERIFY', entity: 'Document', entityId: null, ipAddress: '127.0.0.1' },
      { userId: adminUser.id, action: 'CREATE', entity: 'Institution', entityId: institutions[0].id, ipAddress: '127.0.0.1' },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: financeUser.id,
        title: 'FDR Maturity Alert',
        body: `FDR FDR-000001 matures in 1 day.`,
        type: 'MATURITY_ALERT',
        isRead: false,
      },
      {
        userId: verifierUser.id,
        title: 'Document Pending',
        body: '3 documents pending verification for 2+ days.',
        type: 'DOCUMENT_PENDING',
        isRead: false,
      },
      {
        userId: instUser.id,
        title: 'Release Request Update',
        body: 'Your release request has been submitted.',
        type: 'RELEASE_STATUS',
        isRead: true,
      },
    ],
  });

  console.log('\n📊 Seed Summary:');
  console.log(`  Banks: ${banks.length}`);
  console.log(`  Institutions: ${institutions.length}`);
  console.log(`  Users: 6`);
  console.log(`  FDRs: ${fdrList.length}`);
  console.log(`  System Settings: 1`);
  console.log('\n✅ Seed completed successfully!');
  console.log('\n🔑 Demo Credentials (password: Demo@1234):');
  console.log('  admin@aicte.demo       → SUPER_ADMIN');
  console.log('  finance@aicte.demo     → FINANCE_OFFICER');
  console.log('  verifier@aicte.demo    → VERIFIER');
  console.log('  authority@aicte.demo   → APPROVING_AUTHORITY');
  console.log('  institution@aicte.demo → INSTITUTION_USER');
  console.log('  auditor@aicte.demo     → AUDITOR');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
