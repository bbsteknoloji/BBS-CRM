/**
 * BBS CRM — Database Seed (Faz 0)
 * Çalıştırma: npx prisma db seed
 * Gereksinim: bcryptjs, @prisma/client, tsx
 */
import {
  PrismaClient,
  RoleCode,
  SettingValueType,
  NumberSequenceType,
  ProductType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { company as companyDefaults } from "../src/config/company";

const prisma = new PrismaClient();

const PERMISSIONS: Array<{
  slug: string;
  name: string;
  module: string;
}> = [
  { slug: "customer:read", name: "Müşteri görüntüle", module: "customer" },
  { slug: "customer:write", name: "Müşteri düzenle", module: "customer" },
  { slug: "customer:delete", name: "Müşteri sil", module: "customer" },
  { slug: "customer:assign", name: "Müşteri ata", module: "customer" },
  { slug: "customer:import", name: "Müşteri içe aktar", module: "customer" },
  { slug: "quote:read", name: "Teklif görüntüle", module: "quote" },
  { slug: "quote:write", name: "Teklif düzenle", module: "quote" },
  { slug: "quote:send", name: "Teklif gönder", module: "quote" },
  { slug: "quote:approve", name: "Teklif onayla", module: "quote" },
  { slug: "quote:convert", name: "Teklifi sözleşmeye dönüştür", module: "quote" },
  { slug: "quote:delete", name: "Teklif sil", module: "quote" },
  { slug: "contract:read", name: "Sözleşme görüntüle", module: "contract" },
  { slug: "contract:write", name: "Sözleşme düzenle", module: "contract" },
  { slug: "contract:terminate", name: "Sözleşme feshet", module: "contract" },
  { slug: "contract:renew", name: "Sözleşme yenile", module: "contract" },
  { slug: "contract:delete", name: "Sözleşme sil", module: "contract" },
  { slug: "service:read", name: "Servis talebi görüntüle", module: "service" },
  { slug: "service:write", name: "Servis talebi düzenle", module: "service" },
  { slug: "service:assign", name: "Servis talebi ata", module: "service" },
  { slug: "service:close", name: "Servis talebi kapat", module: "service" },
  { slug: "service:delete", name: "Servis talebi sil", module: "service" },
  { slug: "visit:read", name: "Saha ziyareti görüntüle", module: "visit" },
  { slug: "visit:write", name: "Saha ziyareti düzenle", module: "visit" },
  { slug: "task:read", name: "Görev görüntüle", module: "task" },
  { slug: "task:create", name: "Görev oluştur", module: "task" },
  { slug: "task:update", name: "Görev güncelle", module: "task" },
  { slug: "task:delete", name: "Görev sil", module: "task" },
  { slug: "product:read", name: "Ürün görüntüle", module: "product" },
  { slug: "product:create", name: "Ürün oluştur", module: "product" },
  { slug: "product:update", name: "Ürün güncelle", module: "product" },
  { slug: "product:delete", name: "Ürün sil", module: "product" },
  { slug: "document:read", name: "Dosya görüntüle", module: "document" },
  { slug: "document:upload", name: "Dosya yükle", module: "document" },
  { slug: "document:delete", name: "Dosya sil", module: "document" },
  { slug: "file:read", name: "Dosya merkezi görüntüle", module: "file" },
  { slug: "file:download", name: "Dosya indir", module: "file" },
  { slug: "file:delete", name: "Dosya sil", module: "file" },
  { slug: "notification:read", name: "Bildirim görüntüle", module: "notification" },
  { slug: "report:read", name: "Rapor görüntüle", module: "report" },
  { slug: "report:export", name: "Rapor dışa aktar", module: "report" },
  { slug: "settings:read", name: "Ayarları görüntüle", module: "settings" },
  { slug: "settings:manage", name: "Ayarları yönet", module: "settings" },
  { slug: "user:read", name: "Kullanıcı görüntüle", module: "user" },
  { slug: "user:manage", name: "Kullanıcı yönet", module: "user" },
  { slug: "audit:read", name: "Denetim kaydı görüntüle", module: "audit" },
];

const ROLE_DEFINITIONS: Array<{
  code: RoleCode;
  name: string;
  description: string;
  permissions: string[] | "*";
}> = [
  {
    code: RoleCode.SUPER_ADMIN,
    name: "Süper Yönetici",
    description: "Tam sistem erişimi",
    permissions: "*",
  },
  {
    code: RoleCode.ADMIN,
    name: "Yönetici",
    description: "Operasyon ve raporlama",
    permissions: PERMISSIONS.map((p) => p.slug).filter((s) => s !== "user:manage"),
  },
  {
    code: RoleCode.SALES,
    name: "Satış",
    description: "Müşteri, teklif, görev",
    permissions: [
      "customer:read",
      "customer:write",
      "customer:assign",
      "customer:import",
      "quote:read",
      "quote:write",
      "quote:send",
      "quote:convert",
      "contract:read",
      "contract:write",
      "contract:renew",
      "service:read",
      "service:write",
      "service:assign",
      "visit:read",
      "task:read",
      "task:create",
      "task:update",
      "product:read",
      "document:read",
      "document:upload",
      "file:read",
      "file:download",
      "notification:read",
      "settings:read",
    ],
  },
  {
    code: RoleCode.TECHNICIAN,
    name: "Teknisyen",
    description: "Servis ve saha operasyonları",
    permissions: [
      "customer:read",
      "contract:read",
      "service:read",
      "service:write",
      "service:assign",
      "service:close",
      "visit:read",
      "visit:write",
      "task:read",
      "document:read",
      "document:upload",
      "file:read",
      "file:download",
      "notification:read",
      "settings:read",
    ],
  },
  {
    code: RoleCode.FIELD_OPS,
    name: "Saha Operasyon",
    description: "Saha ziyaretleri ve servis takibi",
    permissions: [
      "customer:read",
      "contract:read",
      "service:read",
      "visit:read",
      "visit:write",
      "task:read",
      "document:read",
      "document:upload",
      "file:read",
      "file:download",
      "notification:read",
      "settings:read",
    ],
  },
  {
    code: RoleCode.VIEWER,
    name: "Görüntüleyici",
    description: "Salt okunur",
    permissions: [
      "customer:read",
      "quote:read",
      "contract:read",
      "service:read",
      "visit:read",
      "task:read",
      "product:read",
      "document:read",
      "file:read",
      "notification:read",
      "report:read",
      "settings:read",
    ],
  },
];

const DEFAULT_SETTINGS: Array<{
  key: string;
  value: string;
  valueType: SettingValueType;
  description: string;
  isPublic: boolean;
}> = [
  {
    key: "company.legal_name",
    value: companyDefaults.name,
    valueType: SettingValueType.STRING,
    description: "Şirket unvanı",
    isPublic: true,
  },
  {
    key: "company.tax_number",
    value: "",
    valueType: SettingValueType.STRING,
    description: "Şirket vergi no",
    isPublic: false,
  },
  {
    key: "quote.default_valid_days",
    value: "30",
    valueType: SettingValueType.NUMBER,
    description: "Teklif varsayılan geçerlilik (gün)",
    isPublic: false,
  },
  {
    key: "contract.default_renewal_notice_days",
    value: "30",
    valueType: SettingValueType.NUMBER,
    description: "Sözleşme yenileme uyarısı (gün)",
    isPublic: false,
  },
  {
    key: "finance.default_tax_rate",
    value: "20",
    valueType: SettingValueType.NUMBER,
    description: "Varsayılan KDV oranı (%)",
    isPublic: false,
  },
  {
    key: "finance.default_currency",
    value: "TRY",
    valueType: SettingValueType.STRING,
    description: "Varsayılan para birimi",
    isPublic: true,
  },
  {
    key: "storage.upload_dir",
    value: "/var/www/bbs-crm/storage/uploads",
    valueType: SettingValueType.STRING,
    description: "Local upload dizini (VPS)",
    isPublic: false,
  },
];

async function seedPermissions() {
  const map = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { name: p.name, module: p.module },
      create: p,
    });
    map.set(p.slug, row.id);
  }
  return map;
}

async function seedRoles(permissionIds: Map<string, string>) {
  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
      },
    });

    const slugs =
      def.permissions === "*"
        ? [...permissionIds.keys()]
        : def.permissions;

    for (const slug of slugs) {
      const permissionId = permissionIds.get(slug);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }
}

async function seedSuperAdmin(companyId: string | null) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@sirketiniz.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const hash = await bcrypt.hash(password, 12);

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.SUPER_ADMIN },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      firstName: "Süper",
      lastName: "Admin",
      ...(companyId ? { companyId } : {}),
    },
    create: {
      email,
      passwordHash: hash,
      firstName: "Süper",
      lastName: "Admin",
      companyId: companyId ?? undefined,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: user.id, roleId: superAdminRole.id },
    },
    update: {},
    create: { userId: user.id, roleId: superAdminRole.id },
  });

  return user;
}

async function seedNumberSequences() {
  const year = new Date().getFullYear();
  await prisma.numberSequence.upsert({
    where: { type_year: { type: NumberSequenceType.QUOTE, year } },
    update: {},
    create: {
      type: NumberSequenceType.QUOTE,
      year,
      prefix: "TEK",
      lastValue: 0,
    },
  });
  await prisma.numberSequence.upsert({
    where: { type_year: { type: NumberSequenceType.CONTRACT, year } },
    update: {},
    create: {
      type: NumberSequenceType.CONTRACT,
      year,
      prefix: "SOZ",
      lastValue: 0,
    },
  });
  await prisma.numberSequence.upsert({
    where: { type_year: { type: NumberSequenceType.SERVICE, year } },
    update: {},
    create: {
      type: NumberSequenceType.SERVICE,
      year,
      prefix: "SRV",
      lastValue: 0,
    },
  });
  await prisma.numberSequence.upsert({
    where: { type_year: { type: NumberSequenceType.VISIT, year } },
    update: {},
    create: {
      type: NumberSequenceType.VISIT,
      year,
      prefix: "VIS",
      lastValue: 0,
    },
  });
}

async function seedCompany(): Promise<string | null> {
  const existing = await prisma.company.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: companyDefaults.name,
        logoUrl: companyDefaults.logo,
        email: companyDefaults.email,
        phone: companyDefaults.phone,
        address: companyDefaults.address,
      },
    });
    return existing.id;
  }

  const created = await prisma.company.create({
    data: {
      name: companyDefaults.name,
      logoUrl: companyDefaults.logo,
      email: companyDefaults.email,
      phone: companyDefaults.phone,
      address: companyDefaults.address,
    },
    select: { id: true },
  });
  return created.id;
}

async function linkUsersToCompany(companyId: string) {
  await prisma.user.updateMany({
    where: { companyId: null, deletedAt: null },
    data: { companyId },
  });
}

async function seedSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {
        value: s.value,
        valueType: s.valueType,
        description: s.description,
        isPublic: s.isPublic,
      },
      create: s,
    });
  }
}

async function seedSampleProducts() {
  const samples = [
    {
      sku: "SRV-CONSULT-001",
      name: "Danışmanlık Hizmeti (Saat)",
      type: ProductType.SERVICE,
      unit: "saat",
      unitPrice: 1500,
      taxRate: 20,
    },
    {
      sku: "SRV-MAINT-001",
      name: "Yıllık Bakım ve Destek",
      type: ProductType.SERVICE,
      unit: "yıl",
      unitPrice: 25000,
      taxRate: 20,
    },
    {
      sku: "PRD-LIC-001",
      name: "Yazılım Lisansı",
      type: ProductType.PRODUCT,
      unit: "adet",
      unitPrice: 10000,
      taxRate: 20,
    },
  ];

  for (const p of samples) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        unitPrice: p.unitPrice,
        taxRate: p.taxRate,
      },
      create: {
        sku: p.sku,
        name: p.name,
        type: p.type,
        unit: p.unit,
        unitPrice: p.unitPrice,
        taxRate: p.taxRate,
      },
    });
  }
}

type DemoCustomer = {
  legalName: string;
  tradeName?: string;
  taxNumber: string;
  taxOffice: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE" | "CHURNED";
  city: string;
  district?: string;
  addressLine: string;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
};

const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    legalName: "Anadolu Lojistik A.Ş.",
    tradeName: "Anadolu Lojistik",
    taxNumber: "1234567890",
    taxOffice: "Kadıköy",
    status: "ACTIVE",
    city: "İstanbul",
    district: "Kadıköy",
    addressLine: "Caferağa Mah. Moda Cad. No:12",
    contactName: "Mehmet Yılmaz",
    phone: "+90 216 555 0101",
    email: "mehmet@anadolulojistik.com",
    website: "https://anadolulojistik.example.com",
  },
  {
    legalName: "Ege Yazılım Ltd. Şti.",
    tradeName: "Ege Yazılım",
    taxNumber: "2345678901",
    taxOffice: "Konak",
    status: "ACTIVE",
    city: "İzmir",
    district: "Konak",
    addressLine: "Alsancak Mah. Kordon No:45",
    contactName: "Ayşe Demir",
    phone: "+90 232 555 0202",
    email: "ayse@egeyazilim.example.com",
  },
  {
    legalName: "Başkent Enerji A.Ş.",
    taxNumber: "3456789012",
    taxOffice: "Çankaya",
    status: "LEAD",
    city: "Ankara",
    district: "Çankaya",
    addressLine: "Kızılay Mah. Atatürk Bulvarı No:100",
    contactName: "Can Öztürk",
    phone: "+90 312 555 0303",
    email: "can@baskentenerji.example.com",
  },
  {
    legalName: "Marmara Tekstil San. Tic. A.Ş.",
    tradeName: "Marmara Tekstil",
    taxNumber: "4567890123",
    taxOffice: "Bursa",
    status: "ACTIVE",
    city: "Bursa",
    addressLine: "Organize Sanayi Bölgesi 3. Cadde",
    contactName: "Fatma Kaya",
    phone: "+90 224 555 0404",
    email: "fatma@marmaratekstil.example.com",
  },
  {
    legalName: "Akdeniz Turizm Hizmetleri A.Ş.",
    taxNumber: "5678901234",
    taxOffice: "Muratpaşa",
    status: "ACTIVE",
    city: "Antalya",
    addressLine: "Lara Yolu No:8",
    contactName: "Burak Arslan",
    phone: "+90 242 555 0505",
    email: "burak@akdenizturizm.example.com",
  },
  {
    legalName: "Karadeniz Gıda Dağıtım Ltd. Şti.",
    taxNumber: "6789012345",
    taxOffice: "İlkadım",
    status: "INACTIVE",
    city: "Samsun",
    addressLine: "Kale Mah. Liman Sok. No:3",
    contactName: "Zeynep Çelik",
    phone: "+90 362 555 0606",
    email: "zeynep@karadenizgida.example.com",
  },
  {
    legalName: "İç Anadolu İnşaat A.Ş.",
    taxNumber: "7890123456",
    taxOffice: "Selçuklu",
    status: "LEAD",
    city: "Konya",
    addressLine: "Bosna Hersek Mah. Millet Cad. No:22",
    contactName: "Emre Şahin",
    phone: "+90 332 555 0707",
    email: "emre@icanadoluinsaat.example.com",
  },
  {
    legalName: "Trakya Tarım Ürünleri A.Ş.",
    taxNumber: "8901234567",
    taxOffice: "Merkez",
    status: "CHURNED",
    city: "Edirne",
    addressLine: "Kıyık Mah. Tarım Cad. No:1",
    contactName: "Selin Aydın",
    phone: "+90 284 555 0808",
    email: "selin@trakyatarim.example.com",
  },
];

async function seedDemoSalesUser(adminId: string, companyId: string | null) {
  const salesRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.SALES },
  });
  const hash = await bcrypt.hash("Sales123!", 12);
  const sales = await prisma.user.upsert({
    where: { email: "satis@sirketiniz.com" },
    update: companyId ? { companyId } : {},
    create: {
      email: "satis@sirketiniz.com",
      passwordHash: hash,
      firstName: "Satış",
      lastName: "Temsilcisi",
      createdById: adminId,
      companyId: companyId ?? undefined,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: sales.id, roleId: salesRole.id },
    },
    update: {},
    create: { userId: sales.id, roleId: salesRole.id },
  });
  return sales;
}

async function seedDemoCustomers(adminId: string, salesId: string) {
  let index = 0;
  for (const demo of DEMO_CUSTOMERS) {
    const assignedToId = index % 2 === 0 ? adminId : salesId;
    index++;

    const existing = await prisma.customer.findFirst({
      where: { taxNumber: demo.taxNumber },
    });
    if (existing) continue;

    const customer = await prisma.customer.create({
      data: {
        legalName: demo.legalName,
        tradeName: demo.tradeName ?? null,
        taxNumber: demo.taxNumber,
        taxOffice: demo.taxOffice,
        website: demo.website ?? null,
        status: demo.status,
        assignedToId,
        createdById: adminId,
        updatedById: adminId,
      },
    });

    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        line1: demo.addressLine,
        district: demo.district ?? null,
        city: demo.city,
        isPrimary: true,
        createdById: adminId,
      },
    });

    await prisma.customerContact.create({
      data: {
        customerId: customer.id,
        fullName: demo.contactName,
        email: demo.email,
        phone: demo.phone,
        isPrimary: true,
        createdById: adminId,
      },
    });

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        type: "NOTE",
        title: "Müşteri oluşturuldu",
        description: `${demo.legalName} demo kaydı.`,
        userId: adminId,
        createdById: adminId,
        metadata: { event: "customer_created", source: "seed" },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CREATE",
        entityType: "customer",
        entityId: customer.id,
        changes: { legalName: demo.legalName, seed: true },
      },
    });
  }
}

async function seedDemoQuotes(adminId: string) {
  const customer = await prisma.customer.findFirst({
    where: { taxNumber: "1234567890" },
  });
  if (!customer) return;

  const existing = await prisma.quote.findFirst({
    where: { customerId: customer.id },
  });
  if (existing) return;

  const product = await prisma.product.findFirst({
    where: { sku: "SRV-CONSULT-001" },
  });

  const quote = await prisma.quote.create({
    data: {
      number: "TEK-2026-0001",
      customerId: customer.id,
      title: "Danışmanlık ve Bakım Teklifi",
      status: "SENT",
      currency: "TRY",
      validUntil: new Date(Date.now() + 30 * 86400000),
      sentAt: new Date(),
      subtotal: "15000.0000",
      taxTotal: "3000.0000",
      total: "18000.0000",
      notes: "Demo teklif — onay akışını test edin.",
      createdById: adminId,
      updatedById: adminId,
      lineItems: {
        create: [
          {
            description: product?.name ?? "Danışmanlık",
            productId: product?.id,
            quantity: "10.0000",
            unit: "saat",
            unitPrice: "1500.0000",
            taxRate: "20.00",
            lineTotal: "18000.0000",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.numberSequence.upsert({
    where: {
      type_year: { type: NumberSequenceType.QUOTE, year: new Date().getFullYear() },
    },
    update: { lastValue: 1 },
    create: {
      type: NumberSequenceType.QUOTE,
      year: new Date().getFullYear(),
      prefix: "TEK",
      lastValue: 1,
    },
  });

  await prisma.activity.create({
    data: {
      customerId: customer.id,
      quoteId: quote.id,
      type: "QUOTE_CREATED",
      title: "Teklif oluşturuldu",
      userId: adminId,
      createdById: adminId,
    },
  });
}

async function seedDemoContracts(adminId: string) {
  const customer = await prisma.customer.findFirst({
    where: { taxNumber: "1234567890" },
  });
  if (!customer) return;

  const existing = await prisma.contract.findFirst({
    where: { customerId: customer.id },
  });
  if (existing) return;

  const product = await prisma.product.findFirst({
    where: { sku: "SRV-CONSULT-001" },
  });

  const start = new Date();
  const endActive = new Date();
  endActive.setMonth(endActive.getMonth() + 6);
  const endSoon = new Date();
  endSoon.setDate(endSoon.getDate() + 25);

  const active = await prisma.contract.create({
    data: {
      number: "SOZ-2026-0001",
      customerId: customer.id,
      title: "Danışmanlık Hizmet Sözleşmesi",
      status: "ACTIVE",
      currency: "TRY",
      startDate: start,
      endDate: endSoon,
      signedAt: new Date(),
      autoRenew: true,
      renewalNoticeDays: 30,
      subtotal: "15000.0000",
      taxTotal: "3000.0000",
      total: "18000.0000",
      notes: "Demo aktif sözleşme — dashboard süre uyarılarını test edin.",
      ownerId: adminId,
      createdById: adminId,
      updatedById: adminId,
      lineItems: {
        create: [
          {
            description: product?.name ?? "Danışmanlık",
            productId: product?.id,
            quantity: "10.0000",
            unit: "saat",
            unitPrice: "1500.0000",
            taxRate: "20.00",
            lineTotal: "18000.0000",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const endDraft = new Date();
  endDraft.setFullYear(endDraft.getFullYear() + 1);

  await prisma.contract.create({
    data: {
      number: "SOZ-2026-0002",
      customerId: customer.id,
      title: "Bakım ve Destek Sözleşmesi (Taslak)",
      status: "DRAFT",
      currency: "TRY",
      startDate: start,
      endDate: endDraft,
      autoRenew: false,
      renewalNoticeDays: 60,
      subtotal: "5000.0000",
      taxTotal: "1000.0000",
      total: "6000.0000",
      ownerId: adminId,
      createdById: adminId,
      updatedById: adminId,
      lineItems: {
        create: [
          {
            description: "Yıllık bakım paketi",
            quantity: "1.0000",
            unit: "adet",
            unitPrice: "6000.0000",
            taxRate: "20.00",
            lineTotal: "6000.0000",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.numberSequence.upsert({
    where: {
      type_year: {
        type: NumberSequenceType.CONTRACT,
        year: new Date().getFullYear(),
      },
    },
    update: { lastValue: 2 },
    create: {
      type: NumberSequenceType.CONTRACT,
      year: new Date().getFullYear(),
      prefix: "SOZ",
      lastValue: 2,
    },
  });

  await prisma.activity.create({
    data: {
      customerId: customer.id,
      contractId: active.id,
      type: "CONTRACT_CREATED",
      title: "Sözleşme oluşturuldu",
      userId: adminId,
      createdById: adminId,
    },
  });

  await prisma.activity.create({
    data: {
      customerId: customer.id,
      contractId: active.id,
      type: "CONTRACT_ACTIVATED",
      title: "Sözleşme aktifleştirildi",
      userId: adminId,
      createdById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "CREATE",
      entityType: "contract",
      entityId: active.id,
      changes: { number: "SOZ-2026-0001", seed: true },
    },
  });
}

async function seedDemoServiceTickets(adminId: string) {
  const customer = await prisma.customer.findFirst({
    where: { taxNumber: "1234567890" },
  });
  if (!customer) return;

  const existing = await prisma.serviceTicket.findFirst({
    where: { customerId: customer.id },
  });
  if (existing) return;

  const contract = await prisma.contract.findFirst({
    where: { number: "SOZ-2026-0001" },
  });

  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNo: "SRV-2026-0001",
      customerId: customer.id,
      contractId: contract?.id,
      title: "Sunucu erişim kesintisi",
      description:
        "Demo servis talebi — müşteri sunucuya RDP ile bağlanamıyor.",
      priority: "HIGH",
      status: "OPEN",
      assignedUserId: adminId,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  await prisma.numberSequence.upsert({
    where: {
      type_year: {
        type: NumberSequenceType.SERVICE,
        year: new Date().getFullYear(),
      },
    },
    update: { lastValue: 1 },
    create: {
      type: NumberSequenceType.SERVICE,
      year: new Date().getFullYear(),
      prefix: "SRV",
      lastValue: 1,
    },
  });

  await prisma.activity.create({
    data: {
      customerId: customer.id,
      serviceTicketId: ticket.id,
      type: "SERVICE_TICKET_CREATED",
      title: "Servis talebi oluşturuldu",
      userId: adminId,
      createdById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "CREATE",
      entityType: "service_ticket",
      entityId: ticket.id,
      changes: { ticketNo: "SRV-2026-0001", seed: true },
    },
  });
}

async function seedDemoVisits(adminId: string) {
  const customer = await prisma.customer.findFirst({
    where: { taxNumber: "1234567890" },
  });
  if (!customer) return;

  const existing = await prisma.visitRecord.findFirst({
    where: { customerId: customer.id },
  });
  if (existing) return;

  const contract = await prisma.contract.findFirst({
    where: { number: "SOZ-2026-0001" },
  });
  const ticket = await prisma.serviceTicket.findFirst({
    where: { ticketNo: "SRV-2026-0001" },
  });

  const visitDate = new Date();
  const nextVisit = new Date();
  nextVisit.setDate(nextVisit.getDate() + 14);

  const visit = await prisma.visitRecord.create({
    data: {
      visitNo: "VIS-2026-0001",
      customerId: customer.id,
      contractId: contract?.id,
      serviceTicketId: ticket?.id,
      userId: adminId,
      visitDate,
      description: "Demo saha ziyareti — altyapı kontrolü ve raporlama.",
      result: "Sunucu odası sıcaklık ve yedekleme kontrolleri tamamlandı.",
      nextVisitDate: nextVisit,
      createdById: adminId,
      updatedById: adminId,
    },
  });

  await prisma.numberSequence.upsert({
    where: {
      type_year: {
        type: NumberSequenceType.VISIT,
        year: new Date().getFullYear(),
      },
    },
    update: { lastValue: 1 },
    create: {
      type: NumberSequenceType.VISIT,
      year: new Date().getFullYear(),
      prefix: "VIS",
      lastValue: 1,
    },
  });

  await prisma.activity.create({
    data: {
      customerId: customer.id,
      visitRecordId: visit.id,
      serviceTicketId: ticket?.id,
      contractId: contract?.id,
      type: "VISIT_RECORDED",
      title: "Saha ziyareti kaydedildi",
      userId: adminId,
      createdById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "CREATE",
      entityType: "visit",
      entityId: visit.id,
      changes: { visitNo: "VIS-2026-0001", seed: true },
    },
  });
}

async function main() {
  console.log("🌱 Seed başlıyor...");

  const permissionIds = await seedPermissions();
  console.log(`✓ ${permissionIds.size} izin`);

  await seedRoles(permissionIds);
  console.log(`✓ ${ROLE_DEFINITIONS.length} rol ve izin matrisi`);

  const companyId = await seedCompany();
  if (companyId) {
    await linkUsersToCompany(companyId);
  }
  console.log("✓ Şirket profili");

  const admin = await seedSuperAdmin(companyId);
  console.log(`✓ Süper admin: ${admin.email}`);

  await seedNumberSequences();
  console.log("✓ Numara serileri (TEK / SOZ)");

  await seedSettings();
  console.log(`✓ ${DEFAULT_SETTINGS.length} ayar`);

  if (process.env.NODE_ENV !== "production") {
    await seedSampleProducts();
    console.log("✓ Örnek ürün kataloğu (dev)");

    const sales = await seedDemoSalesUser(admin.id, companyId);
    await seedDemoCustomers(admin.id, sales.id);
    console.log(`✓ ${DEMO_CUSTOMERS.length} demo müşteri`);

    await seedDemoQuotes(admin.id);
    console.log("✓ Demo teklif (TEK-2026-0001, SENT)");

    await seedDemoContracts(admin.id);
    console.log("✓ Demo sözleşmeler (SOZ-2026-0001 ACTIVE, SOZ-2026-0002 DRAFT)");

    await seedDemoServiceTickets(admin.id);
    console.log("✓ Demo servis talebi (SRV-2026-0001, OPEN)");

    await seedDemoVisits(admin.id);
    console.log("✓ Demo saha ziyareti (VIS-2026-0001)");
    console.log("  Satış kullanıcısı: satis@sirketiniz.com / Sales123!");
  }

  console.log("✅ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
