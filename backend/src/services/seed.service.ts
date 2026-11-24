import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma as defaultPrisma } from '../prisma';

export async function seedTenRecords(p: PrismaClient = defaultPrisma) {
  // 1. Ensure Master Banks exist
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

  for (const b of bankData) {
    await p.bank.upsert({
      where: { shortCode: b.shortCode },
      update: { name: b.name, isActive: true },
      create: b,
    });
  }
  const banks = await p.bank.findMany();
  const bankMap = new Map(banks.map(b => [b.shortCode, b]));

  // 2. Ensure System Settings exist
  await p.systemSetting.upsert({
    where: { key: 'nearMaturityDays' },
    update: { value: '90' },
    create: {
      key: 'nearMaturityDays',
      value: '90',
      description: 'Days before maturity to mark FDR as NEAR_MATURITY',
    },
  });

  // 3. Ensure Default Administrative Users exist
  const pwd = await bcrypt.hash('Demo@1234', 12);
  const defaultUsers = [
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
  ];

  for (const u of defaultUsers) {
    await p.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, phone: u.phone },
      create: u,
    });
  }

  // 4. Clean previous institutions, FDRs, documents, and release data
  await p.alertLog.deleteMany();
  await p.notificationPreference.deleteMany();
  await p.notification.deleteMany();
  await p.releaseStep.deleteMany();
  await p.releaseRequest.deleteMany();
  await p.document.deleteMany();
  await p.auditLog.deleteMany();
  await p.fdr.deleteMany();
  await p.institution.deleteMany();

  // 5. Create 10 Official Institutions (9 active, 1 deleted)
  const now = new Date();
  const deletedInstDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const institutionConfigs = [
    { aicteId: '1-456123891', name: 'College of Engineering, Pune (COEP)', type: 'Engineering', state: 'Maharashtra', city: 'Pune', headName: 'Dr. B. B. Ahuja', headEmail: 'director@coep.ac.in', phone: '020-25507000' },
    { aicteId: '1-398712345', name: 'Veermata Jijabai Technological Institute (VJTI)', type: 'Engineering', state: 'Maharashtra', city: 'Mumbai', headName: 'Dr. Sachin Kore', headEmail: 'director@vjti.ac.in', phone: '022-24198100' },
    { aicteId: '1-109823411', name: 'Delhi Technological University (DTU)', type: 'Engineering', state: 'Delhi', city: 'New Delhi', headName: 'Prof. Prateek Sharma', headEmail: 'vc@dtu.ac.in', phone: '011-27871018' },
    { aicteId: '1-582910342', name: 'R.V. College of Engineering (RVCE)', type: 'Engineering', state: 'Karnataka', city: 'Bengaluru', headName: 'Dr. K. N. Subramanya', headEmail: 'principal@rvce.edu.in', phone: '080-68188100' },
    { aicteId: '1-294817263', name: 'PSG College of Technology', type: 'Engineering', state: 'Tamil Nadu', city: 'Coimbatore', headName: 'Dr. K. Prakasan', headEmail: 'principal@psgtech.edu', phone: '0422-2572177' },
    { aicteId: '1-817263541', name: 'Thapar Institute of Engineering & Technology', type: 'Engineering', state: 'Punjab', city: 'Patiala', headName: 'Dr. Padmakumar Nair', headEmail: 'director@thapar.edu', phone: '0175-2393021' },
    { aicteId: '1-918273645', name: 'Birla Institute of Technology, Mesra', type: 'Engineering', state: 'Jharkhand', city: 'Ranchi', headName: 'Prof. Indranil Manna', headEmail: 'vc@bitmesra.ac.in', phone: '0651-2275444' },
    { aicteId: '1-726154382', name: 'Harcourt Butler Technical University (HBTU)', type: 'Engineering', state: 'Uttar Pradesh', city: 'Kanpur', headName: 'Prof. Samsher', headEmail: 'vc@hbtu.ac.in', phone: '0512-2534001' },
    { aicteId: '1-615243891', name: 'Bombay College of Pharmacy', type: 'Pharmacy', state: 'Maharashtra', city: 'Mumbai', headName: 'Dr. Krishna Iyer', headEmail: 'principal@bcp.edu.in', phone: '022-26670871' },
    { aicteId: '1-514238910', name: 'National Institute of Design (Archived)', type: 'Applied Arts', state: 'Gujarat', city: 'Ahmedabad', headName: 'Prof. Praveen Nahar', headEmail: 'director@nid.edu', phone: '079-26623692', deletedAt: deletedInstDate },
  ];

  const createdInstitutions = [];
  for (const ic of institutionConfigs) {
    const inst = await p.institution.create({
      data: {
        aicteId: ic.aicteId,
        name: ic.name,
        type: ic.type,
        state: ic.state,
        city: ic.city,
        headName: ic.headName,
        headEmail: ic.headEmail,
        phone: ic.phone,
        approvalStatus: 'APPROVED',
        deletedAt: ic.deletedAt || null,
      },
    });
    createdInstitutions.push(inst);
  }

  // Create Institutional User for COEP
  await p.user.upsert({
    where: { email: 'director@coep.ac.in' },
    update: { institutionId: createdInstitutions[0].id },
    create: {
      email: 'director@coep.ac.in',
      passwordHash: pwd,
      role: 'INSTITUTION_USER',
      name: 'Dr. B. B. Ahuja (Director, COEP Technological Univ)',
      phone: '020-25507000',
      institutionId: createdInstitutions[0].id,
    },
  });
  await p.user.upsert({
    where: { email: 'institution@aicte.demo' },
    update: { institutionId: createdInstitutions[0].id },
    create: {
      email: 'institution@aicte.demo',
      passwordHash: pwd,
      role: 'INSTITUTION_USER',
      name: 'Institution User',
      phone: '9000000005',
      institutionId: createdInstitutions[0].id,
    },
  });

  // 6. Create 10 FDR Records (8 Active/Operational, 2 Deleted)
  const deletedFdrDate1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const deletedFdrDate2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const adminUser = await p.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const creatorId = adminUser ? adminUser.id : (await p.user.findFirst())!.id;

  const fdrConfigs = [
    {
      fdrNumber: 'SBI/FDR/2024/100001',
      instIdx: 0,
      bankCode: 'SBI',
      branch: 'Shivajinagar Branch, Pune',
      ifsc: 'SBIN0001110',
      principal: BigInt(1000000000), // ₹1,00,00,000
      interestRate: 7.25,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2024-04-15T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2029-04-15T00:00:00.000Z'),
      maturityAmount: BigInt(1428246200),
      status: 'ACTIVE',
      academicYear: '2024-2025',
    },
    {
      fdrNumber: 'PNB/FDR/2023/100002',
      instIdx: 1,
      bankCode: 'PNB',
      branch: 'Matunga Branch, Mumbai',
      ifsc: 'PUNB0002220',
      principal: BigInt(750000000), // ₹75,00,000
      interestRate: 7.1,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2023-08-10T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2028-08-10T00:00:00.000Z'),
      maturityAmount: BigInt(1063920000),
      status: 'ACTIVE',
      academicYear: '2023-2024',
    },
    {
      fdrNumber: 'HDFC/FDR/2024/100003',
      instIdx: 2,
      bankCode: 'HDFC',
      branch: 'Connaught Place, New Delhi',
      ifsc: 'HDFC0001234',
      principal: BigInt(2000000000), // ₹2,00,00,000
      interestRate: 7.4,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2024-02-01T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2029-02-01T00:00:00.000Z'),
      maturityAmount: BigInt(2882510000),
      status: 'ACTIVE',
      academicYear: '2024-2025',
    },
    {
      fdrNumber: 'CANARA/FDR/2021/100004',
      instIdx: 3,
      bankCode: 'CANARA',
      branch: 'Mysore Road, Bengaluru',
      ifsc: 'CNRB0003330',
      principal: BigInt(500000000), // ₹50,00,000
      interestRate: 6.85,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2021-01-10T00:00:00.000Z'),
      tenureMonths: 72,
      maturityDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      maturityAmount: BigInt(748900000),
      status: 'NEAR_MATURITY',
      academicYear: '2021-2022',
    },
    {
      fdrNumber: 'ICICI/FDR/2020/100005',
      instIdx: 4,
      bankCode: 'ICICI',
      branch: 'Peelamedu, Coimbatore',
      ifsc: 'ICIC0004440',
      principal: BigInt(1500000000), // ₹1,50,00,000
      interestRate: 6.75,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2020-05-20T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2025-05-20T00:00:00.000Z'),
      maturityAmount: BigInt(2095000000),
      status: 'MATURED',
      academicYear: '2020-2021',
    },
    {
      fdrNumber: 'BOB/FDR/2022/100006',
      instIdx: 5,
      bankCode: 'BOB',
      branch: 'The Mall, Patiala',
      ifsc: 'BARB0005550',
      principal: BigInt(350000000), // ₹35,00,000
      interestRate: 7.0,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2022-07-15T00:00:00.000Z'),
      tenureMonths: 36,
      maturityDate: new Date('2025-07-15T00:00:00.000Z'),
      maturityAmount: BigInt(430900000),
      status: 'RENEWED',
      academicYear: '2022-2023',
    },
    {
      fdrNumber: 'UNION/FDR/2023/100007',
      instIdx: 6,
      bankCode: 'UNION',
      branch: 'Main Road, Ranchi',
      ifsc: 'UBIN0006660',
      principal: BigInt(800000000), // ₹80,00,000
      interestRate: 7.15,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2023-11-05T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2028-11-05T00:00:00.000Z'),
      maturityAmount: BigInt(1137800000),
      status: 'ACTIVE',
      academicYear: '2023-2024',
    },
    {
      fdrNumber: 'AXIS/FDR/2024/100008',
      instIdx: 7,
      bankCode: 'AXIS',
      branch: 'Civil Lines, Kanpur',
      ifsc: 'UTIB0007770',
      principal: BigInt(600000000), // ₹60,00,000
      interestRate: 7.3,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2024-03-12T00:00:00.000Z'),
      tenureMonths: 60,
      maturityDate: new Date('2029-03-12T00:00:00.000Z'),
      maturityAmount: BigInt(859000000),
      status: 'ACTIVE',
      academicYear: '2024-2025',
    },
    // 9. Soft Deleted FDR
    {
      fdrNumber: 'KOTAK/FDR/2023/100009',
      instIdx: 8,
      bankCode: 'KOTAK',
      branch: 'Bandra Kurla Complex, Mumbai',
      ifsc: 'KKBK0008880',
      principal: BigInt(400000000), // ₹40,00,000
      interestRate: 7.1,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2023-06-18T00:00:00.000Z'),
      tenureMonths: 36,
      maturityDate: new Date('2026-06-18T00:00:00.000Z'),
      maturityAmount: BigInt(493000000),
      status: 'ACTIVE',
      academicYear: '2023-2024',
      deletedAt: deletedFdrDate1,
    },
    // 10. Soft Deleted FDR
    {
      fdrNumber: 'IDBI/FDR/2022/100010',
      instIdx: 0,
      bankCode: 'IDBI',
      branch: 'FC Road Branch, Pune',
      ifsc: 'IBKL0009990',
      principal: BigInt(450000000), // ₹45,00,000
      interestRate: 6.95,
      interestType: 'CUMULATIVE',
      issueDate: new Date('2022-09-01T00:00:00.000Z'),
      tenureMonths: 36,
      maturityDate: new Date('2025-09-01T00:00:00.000Z'),
      maturityAmount: BigInt(552000000),
      status: 'ACTIVE',
      academicYear: '2022-2023',
      deletedAt: deletedFdrDate2,
    },
  ];

  for (const cfg of fdrConfigs) {
    const institution = createdInstitutions[cfg.instIdx];
    const bank = bankMap.get(cfg.bankCode);
    if (!bank) continue;

    await p.fdr.create({
      data: {
        fdrNumber: cfg.fdrNumber,
        institutionId: institution.id,
        bankId: bank.id,
        branch: cfg.branch,
        ifsc: cfg.ifsc,
        principal: cfg.principal,
        interestRate: cfg.interestRate,
        interestType: cfg.interestType,
        issueDate: cfg.issueDate,
        tenureMonths: cfg.tenureMonths,
        maturityDate: cfg.maturityDate,
        maturityAmount: cfg.maturityAmount,
        status: cfg.status,
        purpose: 'SECURITY_DEPOSIT',
        academicYear: cfg.academicYear,
        lienMarked: true,
        createdById: creatorId,
        deletedAt: cfg.deletedAt || null,
      },
    });
  }

  return { institutions: createdInstitutions.length, fdrs: fdrConfigs.length };
}
