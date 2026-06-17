import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';
import { initialDbState } from '../data/initialDb.js';

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { salt, hash };
}

export async function seedProducts() {
  const { data: existing } = await supabaseAdmin.from('products').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[Supabase Seeder] Seeding initial products...');
  for (const prod of initialDbState.products) {
    await supabaseAdmin.from('products').upsert({
      id: prod.id,
      type: prod.type,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      description: prod.description,
      category: prod.category,
      stock: prod.stock,
      features: prod.features || [],
    });
  }
}

export async function seedOrders() {
  const { data: existing } = await supabaseAdmin.from('orders').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[Supabase Seeder] Seeding initial orders...');
  for (const order of initialDbState.orders) {
    await supabaseAdmin.from('orders').upsert({
      id: order.id,
      user_email: order.userEmail,
      user_name: order.userName,
      items: order.items,
      total: order.total,
      payment_method: order.paymentMethod,
      status: order.status,
      shipping_address: order.shippingAddress,
      phone: order.phone,
      created_at: order.createdAt,
    });
  }
}

export async function seedUsers() {
  const { data: existing } = await supabaseAdmin.from('users').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[Supabase Seeder] Seeding initial users...');
  for (const user of initialDbState.users) {
    const seededUser: any = { ...user };
    let passwordHash = '';
    let passwordSalt = '';
    if (seededUser.email === 'annierfq01@gmail.com') {
      const hashed = hashPassword('admin');
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }
    await supabaseAdmin.from('users').upsert({
      id: seededUser.id,
      email: seededUser.email,
      name: seededUser.name,
      password: passwordHash,
      salt: passwordSalt,
      role: seededUser.role || 'cliente',
      active: seededUser.active ?? true,
      created_at: seededUser.createdAt || new Date().toISOString(),
    });
  }
}

export async function seedSettings() {
  const { data: existing } = await supabaseAdmin.from('settings').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[Supabase Seeder] Seeding initial settings...');
  const settings = initialDbState.settings;
  await supabaseAdmin.from('settings').upsert({
    id: 'system',
    payments_enabled: settings.paymentsEnabled ?? true,
    payment_methods: settings.paymentMethods || [],
    contact_phone: settings.contactPhone || '+53 5212 3456',
    contact_email: settings.contactEmail || 'cuba@treckmotors.com',
    shop_address: settings.shopAddress || 'Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba',
    shop_hours: settings.shopHours || 'Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM',
    reservations_enabled: settings.reservationsEnabled ?? true,
    facebook_url: settings.facebookUrl || 'https://facebook.com/treckmotorscuba',
    instagram_url: settings.instagramUrl || 'https://instagram.com/treckmotorscuba',
    whatsapp_number: settings.whatsappNumber || '+5352123456',
  });
}

export async function seedReviews() {
  const { data: existing } = await supabaseAdmin.from('reviews').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[Supabase Seeder] Seeding initial reviews...');
  const initialReviews = [
    {
      id: 'rev-1',
      product_id: 'ducati-v4r',
      user_email: 'invitado@gmail.com',
      user_name: 'Juan Pérez',
      rating: 5,
      comment: 'Una locura de moto, la potencia es brutal y el sonido te pone los pelos de punta.',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rev-2',
      product_id: 'yamaha-r1m',
      user_email: 'cliente-demo@redline.com',
      user_name: 'Sofía Medina',
      rating: 5,
      comment: 'El chasis es súper ligero y la estabilidad que otorga en las curvas es inigualable.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rev-3',
      product_id: 'escape-akrapovic',
      user_email: 'annierfq01@gmail.com',
      user_name: 'Annier FQ',
      rating: 4,
      comment: 'Excelente incremento de sonido y peso ultra liviano. El único contra es el precio pero vale cada centavo.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  for (const rev of initialReviews) {
    await supabaseAdmin.from('reviews').upsert(rev);
  }
}

export async function runAllSeeds() {
  await Promise.all([seedProducts(), seedOrders(), seedUsers(), seedSettings(), seedReviews()]);
}
