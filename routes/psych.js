const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const User = require('../models/User')
const PsychologistProfile = require('../models/PsychologistProfile')
const AvailabilitySlot = require('../models/AvailabilitySlot')
const Session = require('../models/Session')
const Review = require('../models/Review')
const CommissionSettings = require('../models/CommissionSettings')
const Specialty = require('../models/Specialty')
const Notification = require('../models/Notification')
const PsychologistService = require('../models/PsychologistService')
const Chat = require('../models/Chat')
const Message = require('../models/Message')

const router = express.Router()

function ensurePsych(req, res, next) {
  if (!req.user) return res.status(401).render('error', { message: 'Inicia sesión para acceder' })
  if (req.user.role !== 'psychologist' && req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Acceso restringido al panel del psicólogo' })
  }
  next()
}

async function purgeExpiredServices() {
  const now = new Date()
  const expired = await PsychologistService.find({ status: 'active', endDate: { $lt: now } }).select('_id psychologist')
  for (const s of expired) {
    await PsychologistService.deleteOne({ _id: s._id })
    try {
      await Notification.create({ recipient: s.psychologist, type: 'service_expired', title: 'Publicación finalizada', message: 'El tiempo de tu publicación ha culminado.' })
    } catch (_) {}
  }
}

// Acceso público/usuario a centro de publicaciones
router.get('/services', async (req, res) => {
  await purgeExpiredServices()
  const u = res.locals.user
  const isManager = u && (u.role === 'psychologist' || u.role === 'admin')
  const services = await (isManager
    ? PsychologistService.find({ psychologist: u._id })
        .populate('specialty')
        .sort({ createdAt: -1 })
        .lean()
    : PsychologistService.find({ status: 'active' })
        .populate('psychologist', 'name createdAt')
        .populate('specialty')
        .sort({ createdAt: -1 })
        .lean())
  const specialties = isManager ? await Specialty.find({ active: true }).sort({ name: 1 }).lean() : []
  res.render('psych/services', { services, specialties })
})

// Nueva sección pública de publicaciones
router.get('/publications', async (req, res) => {
  await purgeExpiredServices()
  const services = await PsychologistService.find({ status: 'active' })
    .populate('psychologist', 'name createdAt')
    .populate('specialty')
    .sort({ createdAt: -1 })
    .lean()

  const byPsych = {}
  services.forEach(s => {
    const pid = s.psychologist?._id?.toString()
    if (pid) { if (!byPsych[pid]) byPsych[pid] = []; byPsych[pid].push(s) }
  })

  const calendarData = {}
  const psychIds = Object.keys(byPsych)
  for (const pid of psychIds) {
    const svcs = byPsych[pid]
    const sdList = svcs.map(s => s.startDate ? new Date(s.startDate).getTime() : NaN).filter(n => !Number.isNaN(n))
    const edList = svcs.map(s => s.endDate ? new Date(s.endDate).getTime() : NaN).filter(n => !Number.isNaN(n))
    const now = new Date()
    const windowStart = sdList.length ? new Date(Math.min(...sdList)) : now
    let windowEnd = edList.length ? new Date(Math.max(...edList)) : new Date(now.getTime() + 30*24*60*60*1000)
    if (windowEnd < windowStart) windowEnd = new Date(windowStart.getTime())

    const slots = await AvailabilitySlot.find({ psychologist: pid, isBlocked: false, start: { $gte: windowStart, $lte: windowEnd } }).sort({ start: 1 }).lean()
    const bookedSessions = await Session.find({ psychologist: pid, status: { $in: ['pending','confirmed'] }, start: { $gte: windowStart, $lte: windowEnd } }).select('start').lean()
    const bookedDays = Array.from(new Set(bookedSessions.map(ss => new Date(ss.start).toISOString().slice(0,10))))
    const availableDays = Array.from(new Set(slots.filter(sl => !sl.isBooked).map(sl => new Date(sl.start).toISOString().slice(0,10))))
    calendarData[pid] = { windowStart, windowEnd, bookedDays, availableDays }
  }

  const selectedPsychId = (req.query.psych || '').toString()
  const selectedDayIso = (req.query.date || '').slice(0,10)
  let daySlots = []
  if (selectedPsychId && selectedDayIso) {
    const dayStart = new Date(selectedDayIso); dayStart.setHours(0,0,0,0)
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1)
    daySlots = await AvailabilitySlot.find({ psychologist: selectedPsychId, isBlocked: false, isBooked: false, start: { $gte: dayStart, $lt: dayEnd } }).sort({ start: 1 }).lean()
  }

  res.render('psych/publications', { services, calendarData, selectedPsychId, selectedDayIso, daySlots })
})

// Sección mínima pública: muestra sólo header y footer
router.get('/min', async (req, res) => {
  res.render('ruta8/index', { title: 'Sección' })
})

router.use(protect)


router.get('/sessions', ensurePsych, async (req, res) => {
  const pending = await Session.find({ psychologist: req.user._id, status: { $in: ['pending', 'confirmed'] } }).sort({ start: 1 }).lean()
  const completed = await Session.find({ psychologist: req.user._id, status: 'completed' }).sort({ start: -1 }).lean()
  const canceled = await Session.find({ psychologist: req.user._id, status: 'canceled' }).sort({ start: -1 }).lean()
  res.render('psych/sessions', { pending, completed, canceled })
})

// Bandeja de chats para psicólogos
router.get('/chats', ensurePsych, async (req, res) => {
  const baseChats = await Chat.find({ psychologist: req.user._id }).populate('user', 'name').sort({ lastMessageAt: -1 }).lean()
  const chats = []
  for (const c of baseChats) {
    const lastMsg = await Message.findOne({ chat: c._id }).sort({ createdAt: -1 }).lean()
    chats.push({
      ...c,
      lastMsgText: lastMsg ? lastMsg.text : '',
      unreadForPsych: new Date(c.lastMessageAt).getTime() > new Date(c.psychLastReadAt || 0).getTime()
    })
  }
  const selectedId = (req.query.chat || '').toString()
  let messages = []
  let selectedChat = null
  if (selectedId) {
    const sc = await Chat.findOne({ _id: selectedId, psychologist: req.user._id })
      .populate('user', 'name')
    selectedChat = sc ? sc.toObject() : null
    if (selectedChat) {
      messages = await Message.find({ chat: selectedChat._id }).populate('sender', 'name').sort({ createdAt: 1 }).lean()
      sc.psychLastReadAt = new Date()
      await sc.save()
    }
  }
  res.render('psych/chats', { chats, selectedChat, messages })
})

// Bandeja de chats para usuarios
router.get('/user-chats', async (req, res) => {
  if (req.user && (req.user.role === 'psychologist' || req.user.role === 'admin')) {
    const baseChats = await Chat.find({ psychologist: req.user._id }).populate('user', 'name').sort({ lastMessageAt: -1 }).lean()
    const chats = []
    for (const c of baseChats) {
      const lastMsg = await Message.findOne({ chat: c._id }).sort({ createdAt: -1 }).lean()
      chats.push({
        ...c,
        lastMsgText: lastMsg ? lastMsg.text : '',
        unreadForPsych: new Date(c.lastMessageAt).getTime() > new Date(c.psychLastReadAt || 0).getTime()
      })
    }
    const selectedId = (req.query.chat || '').toString()
    let messages = []
    let selectedChat = null
    if (selectedId) {
      const sc = await Chat.findOne({ _id: selectedId, psychologist: req.user._id })
        .populate('user', 'name')
      selectedChat = sc ? sc.toObject() : null
      if (selectedChat) {
        messages = await Message.find({ chat: selectedChat._id }).populate('sender', 'name').sort({ createdAt: 1 }).lean()
        sc.psychLastReadAt = new Date()
        await sc.save()
      }
    }
    return res.render('psych/chats', { chats, selectedChat, messages })
  } else {
    const baseChats = await Chat.find({ user: req.user._id }).populate('psychologist', 'name').sort({ lastMessageAt: -1 }).lean()
    const chats = []
    for (const c of baseChats) {
      const lastMsg = await Message.findOne({ chat: c._id }).sort({ createdAt: -1 }).lean()
      chats.push({
        ...c,
        lastMsgText: lastMsg ? lastMsg.text : '',
        unreadForUser: new Date(c.lastMessageAt).getTime() > new Date(c.userLastReadAt || 0).getTime()
      })
    }
    const selectedId = (req.query.chat || '').toString()
    let messages = []
    let selectedChat = null
    if (selectedId) {
      const sc = await Chat.findOne({ _id: selectedId, user: req.user._id })
        .populate('psychologist', 'name')
      selectedChat = sc ? sc.toObject() : null
      if (selectedChat) {
        messages = await Message.find({ chat: selectedChat._id }).populate('sender', 'name').sort({ createdAt: 1 }).lean()
        sc.userLastReadAt = new Date()
        await sc.save()
      }
    }
    return res.render('user/chats', { chats, selectedChat, messages })
  }
})

// Enviar primer o siguiente mensaje desde usuario
router.post('/chats/start', async (req, res) => {
  const psychId = (req.body.psychId || req.body.psychologist || '').toString()
  const text = (req.body.text || req.body.message || '').toString().trim()
  if (!psychId || !text) {
    const returnUrl = (req.body.returnUrl || '/psych/publications').toString()
    return res.redirect(returnUrl)
  }
  const p = await User.findById(psychId).select('_id role')
  if (!p || (p.role !== 'psychologist' && p.role !== 'admin')) {
    const returnUrl = (req.body.returnUrl || '/psych/publications').toString()
    return res.redirect(returnUrl)
  }
  let chat = await Chat.findOne({ psychologist: psychId, user: req.user._id })
  if (!chat) {
    chat = await Chat.create({ psychologist: psychId, user: req.user._id, lastMessageAt: new Date() })
  }
  await Message.create({ chat: chat._id, sender: req.user._id, text })
  chat.lastMessageAt = new Date()
  await chat.save()
  try {
    const payload = { type: 'chat_message', chatId: chat._id.toString(), text, senderId: req.user._id.toString(), createdAt: new Date().toISOString() }
    if (req.app?.locals?.broadcastToUser) {
      req.app.locals.broadcastToUser(req.user._id.toString(), payload)
      req.app.locals.broadcastToUser(psychId.toString(), payload)
    }
  } catch (_) {}
  const returnUrl = (req.body.returnUrl || `/psych/publications?psych=${psychId}#chat-modal-${psychId}`).toString()
  res.redirect(returnUrl)
})

// Enviar mensaje como psicólogo
router.post('/chats/:id/send', ensurePsych, async (req, res) => {
  const id = req.params.id
  const text = (req.body.text || req.body.message || '').toString().trim()
  const chat = await Chat.findOne({ _id: id, psychologist: req.user._id })
  if (chat && text) {
    await Message.create({ chat: chat._id, sender: req.user._id, text })
    chat.lastMessageAt = new Date()
    await chat.save()
    try {
      const payload = { type: 'chat_message', chatId: chat._id.toString(), text, senderId: req.user._id.toString(), createdAt: new Date().toISOString() }
      if (req.app?.locals?.broadcastToUser) {
        req.app.locals.broadcastToUser(req.user._id.toString(), payload)
        req.app.locals.broadcastToUser(chat.user.toString(), payload)
      }
    } catch (_) {}
  }
  res.redirect(`/psych/chats?chat=${id}`)
})

// Obtener hilo de chat del usuario con un psicólogo
router.get('/chats/thread', async (req, res) => {
  const psychId = (req.query.psych || '').toString()
  if (!psychId) return res.json({ chatId: null, messages: [] })
  const sc = await Chat.findOne({ psychologist: psychId, user: req.user._id })
  const chat = sc ? sc.toObject() : null
  let messages = []
  if (chat) {
    messages = await Message.find({ chat: chat._id }).populate('sender', 'name').sort({ createdAt: 1 }).lean()
    sc.userLastReadAt = new Date()
    await sc.save()
  }
  res.json({ chatId: chat ? chat._id : null, messages })
})

router.post('/sessions/:id/generate-video', ensurePsych, async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, psychologist: req.user._id })
  if (!session) return res.status(404).render('error', { message: 'Sesión no encontrada' })
  session.videoLink = `https://meet.jit.si/braincare-${session._id}`
  await session.save()
  res.redirect('/psych/sessions')
})

router.post('/sessions/:id/complete', ensurePsych, async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, psychologist: req.user._id })
  if (!session) return res.status(404).render('error', { message: 'Sesión no encontrada' })
  session.status = 'completed'
  await session.save()
  res.redirect('/psych/sessions')
})

router.get('/payments', ensurePsych, async (req, res) => {
  const sessions = await Session.find({ psychologist: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).lean()
  res.render('psych/payments', { sessions })
})

router.get('/reviews', ensurePsych, async (req, res) => {
  const reviews = await Review.find({ psychologist: req.user._id }).sort({ createdAt: -1 }).lean()
  res.render('psych/reviews', { reviews })
})

// Alias raíz para usuarios: mostrar servicios públicos
router.get('/', async (req, res) => {
  await purgeExpiredServices()
  const u = res.locals.user
  const isManager = u && (u.role === 'psychologist' || u.role === 'admin')
  if (isManager) return res.redirect('/psych/services')
  const services = await PsychologistService.find({ status: 'active' })
    .populate('psychologist', 'name createdAt')
    .populate('specialty')
    .sort({ createdAt: -1 })
    .lean()
  res.render('psych/services', { services, specialties: [] })
})

router.post('/services/create', ensurePsych, async (req, res) => {
  const { problems = [], problemsCustom, sessionKind, serviceType, price, durationMinutes, description, specialty, startDate, endDate } = req.body
  const sd = startDate ? new Date(startDate) : new Date()
  const ed = endDate ? new Date(endDate) : new Date()
  if (ed < sd) ed.setTime(sd.getTime())
  const svc = new PsychologistService({
    psychologist: req.user._id,
    problems: Array.isArray(problems) ? problems : (problems ? [problems] : []),
    problemsCustom: problemsCustom || '',
    sessionKind,
    serviceType,
    price: Number(price) || 0,
    durationMinutes: Number(durationMinutes) || 60,
    description: description || '',
    specialty: specialty || null,
    startDate: sd,
    endDate: ed,
    status: 'active'
  })
  await svc.save()
  res.redirect('/psych/services')
})

router.post('/services/:id/complete', ensurePsych, async (req, res) => {
  const svc = await PsychologistService.findOne({ _id: req.params.id, psychologist: req.user._id })
  if (svc) { svc.status = 'completed'; await svc.save() }
  res.redirect('/psych/services')
})

router.post('/services/:id/delete', ensurePsych, async (req, res) => {
  const svc = await PsychologistService.findOne({ _id: req.params.id, psychologist: req.user._id })
  if (svc && svc.status === 'completed') {
    await PsychologistService.deleteOne({ _id: svc._id })
  }
  res.redirect('/psych/services')
})

router.get('/explore', async (req, res) => {
  await purgeExpiredServices()
  const q = (req.query.q || '').trim().toLowerCase()
  const minPrice = Number(req.query.min) || 0
  const maxPrice = Number(req.query.max) || 1000000
  const sort = (req.query.sort || 'recent')

  let profiles = await PsychologistProfile.find({ active: true, price: { $gte: minPrice, $lte: maxPrice } })
    .populate('user', 'name createdAt')
    .populate('specialties')
    .lean()

  // Map de ratings para psicólogos
  const ratingsMap = {}
  profiles.forEach(p => { if (p.user?._id) ratingsMap[p.user._id.toString()] = { ratingAverage: p.ratingAverage || 0, ratingCount: p.ratingCount || 0 } })

  if (q) {
    profiles = profiles.filter(p => (p.user && p.user.name && p.user.name.toLowerCase().includes(q)) || (p.bio || '').toLowerCase().includes(q))
  }

  if (sort === 'rating') {
    profiles.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
  } else if (sort === 'reviews') {
    profiles.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
  } else {
    profiles.sort((a, b) => new Date(b.createdAt || b.user?.createdAt || 0) - new Date(a.createdAt || a.user?.createdAt || 0))
  }

  const profilesMap = {}
  profiles.forEach(p => { if (p.user?._id) profilesMap[p.user._id.toString()] = { price: p.price || 0, createdAt: p.createdAt || p.user?.createdAt, ratingAverage: p.ratingAverage || 0, ratingCount: p.ratingCount || 0 } })

  // Servicios activos de todos los psicólogos
  let services = await PsychologistService.find({ status: 'active' })
    .populate('psychologist', 'name createdAt')
    .populate('specialty')
    .lean()

  // Aplicar búsqueda por nombre del psicólogo o tipo de servicio
  if (q) {
    services = services.filter(s => (s.psychologist && s.psychologist.name && s.psychologist.name.toLowerCase().includes(q)) || (s.serviceType || '').toLowerCase().includes(q))
  }

  // Enriquecer con ratings del psicólogo
  services = services.map(s => {
    const key = s.psychologist?._id ? s.psychologist._id.toString() : ''
    const r = ratingsMap[key] || { ratingAverage: 0, ratingCount: 0 }
    return { ...s, ratingAverage: r.ratingAverage, ratingCount: r.ratingCount }
  })

  // Ordenar servicios según sort
  if (sort === 'rating') {
    services.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
  } else if (sort === 'reviews') {
    services.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
  } else {
    services.sort((a, b) => new Date(b.createdAt || b.psychologist?.createdAt || 0) - new Date(a.createdAt || a.psychologist?.createdAt || 0))
  }

  const now = new Date()
  let slots = await AvailabilitySlot.find({ isBooked: false, isBlocked: false, start: { $gte: now } })
    .populate('psychologist', 'name createdAt')
    .sort({ start: 1 })
    .lean()

  if (q) {
    slots = slots.filter(s => (s.psychologist && s.psychologist.name && s.psychologist.name.toLowerCase().includes(q)))
  }

  slots = slots.map(s => {
    const key = s.psychologist?._id ? s.psychologist._id.toString() : ''
    const p = profilesMap[key] || { price: 0, ratingAverage: 0, ratingCount: 0 }
    const dur = Math.max(0, Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000))
    return { ...s, price: p.price, ratingAverage: p.ratingAverage, ratingCount: p.ratingCount, durationMinutes: dur }
  })

  if (sort === 'rating') {
    slots.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
  } else if (sort === 'reviews') {
    slots.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
  } else {
    slots.sort((a, b) => new Date(b.start || b.psychologist?.createdAt || 0) - new Date(a.start || a.psychologist?.createdAt || 0))
  }

  res.render('marketplace/psychologists', { profiles, services, slots, q, sort })
})

router.get('/p/:id', async (req, res) => {
  const profile = await PsychologistProfile.findOne({ user: req.params.id }).populate('user', 'name').populate('specialties').lean()
  if (!profile) return res.status(404).render('error', { message: 'Perfil no encontrado' })
  const now = new Date()
  const slots = await AvailabilitySlot.find({ psychologist: req.params.id, isBlocked: false, start: { $gte: now } }).sort({ start: 1 }).lean()
  const services = await PsychologistService.find({ psychologist: req.params.id, status: 'active' }).lean()
  let windowStart = now
  let windowEnd = new Date(now.getTime() + 30*24*60*60*1000)
  if (services && services.length) {
    const sdList = services
      .map(s => s.startDate ? new Date(s.startDate).getTime() : NaN)
      .filter(n => !Number.isNaN(n))
    const edList = services
      .map(s => s.endDate ? new Date(s.endDate).getTime() : NaN)
      .filter(n => !Number.isNaN(n))
    if (sdList.length) windowStart = new Date(Math.min(...sdList))
    if (edList.length) windowEnd = new Date(Math.max(...edList))
    if (windowEnd < windowStart) windowEnd = new Date(windowStart.getTime())
  }
  const bookedSessions = await Session.find({ psychologist: req.params.id, status: { $in: ['pending','confirmed'] } }).select('start').lean()
  const bookedDays = Array.from(new Set(bookedSessions.map(ss => new Date(ss.start).toISOString().slice(0,10))))
  const availableDays = Array.from(new Set(slots.filter(sl => !sl.isBooked).map(sl => new Date(sl.start).toISOString().slice(0,10))))
  const selectedDayIso = (req.query.date || '').slice(0,10)
  let filteredSlots = slots
  if (selectedDayIso) {
    const dayStart = new Date(selectedDayIso)
    dayStart.setHours(0,0,0,0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate()+1)
    filteredSlots = slots.filter(s => new Date(s.start) >= dayStart && new Date(s.start) < dayEnd && !s.isBooked)
  }
  res.render('marketplace/psychologist-profile', { profile, slots: filteredSlots, windowStart, windowEnd, bookedDays, availableDays, selectedDayIso })
})

router.post('/p/:id/book', protect, async (req, res) => {
  const slot = await AvailabilitySlot.findOne({ _id: req.body.slotId, psychologist: req.params.id, isBooked: false, isBlocked: false })
  if (!slot) return res.status(400).render('error', { message: 'Horario no disponible' })
  const commission = await CommissionSettings.findOne({ active: true }).sort({ effectiveFrom: -1 }).lean()
  const profile = await PsychologistProfile.findOne({ user: req.params.id }).lean()
  const price = profile ? profile.price : 0
  const percent = commission ? commission.percent : 0
  const commissionAmount = Math.round(price * percent) / 100
  const netAmount = Math.max(0, price - commissionAmount)
  const session = new Session({ psychologist: req.params.id, user: req.user._id, start: slot.start, end: slot.end, status: 'confirmed', price, commissionPercent: percent, commissionAmount, netAmount, availabilitySlot: slot._id })
  await session.save()
  slot.isBooked = true
  await slot.save()
  try {
    await Notification.create({ recipient: req.params.id, type: 'new_session', title: 'Nueva sesión reservada', message: `Un usuario reservó una sesión el ${new Date(slot.start).toLocaleString('es-ES')}`, relatedReport: null })
  } catch (_) {}
  const returnUrl = (req.body.returnUrl || '').toString()
  if (returnUrl) {
    return res.redirect(returnUrl)
  }
  res.redirect(`/psych/p/${req.params.id}`)
})

// Consentimiento de chat: solicitar por el usuario

module.exports = router
