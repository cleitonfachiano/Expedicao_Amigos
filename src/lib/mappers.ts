import type { User, Profile, Expedition, Transaction, MonthlyFee, FinancialTransaction, Task, Boat, Team, ChecklistItem, ChecklistTemplate, TShirtOrder } from '../store/useStore';

// -- Mappers from DB to App (snake_case -> camelCase) -- //

export const mapUser = (db: any): User => ({
    id: db.id,
    name: db.name || db.email?.split('@')[0] || 'Usuário',
    username: db.email || db.id,
    passwordHash: '',
    forcePasswordChange: db.force_password_change || false,
    role: db.role,
});

export const mapProfile = (db: any): Profile => ({
    id: db.id,
    name: db.name,
    type: db.type,
    phone: db.phone || '',
    email: db.email || '',
    drinksAlcohol: db.drinks_alcohol,
    isActive: db.is_active,
});

export const mapExpedition = (db: any): Expedition => ({
    id: db.id,
    name: db.name,
    year: db.year,
    startDate: db.start_date,
    endDate: db.end_date,
    location: db.location,
    participants: [], // will be loaded via a join or separately
});

export const mapTransaction = (db: any): Transaction => ({
    id: db.id,
    expeditionId: db.expedition_id,
    description: db.description,
    amount: Number(db.amount),
    unitPrice: Number(db.unit_price),
    totalPrice: Number(db.total_price),
    purchaseDate: db.purchase_date,
    purchasedBy: db.purchased_by || '',
    category: db.category,
    isExpense: db.is_expense,
    isForDrinkersOnly: db.is_for_drinkers_only,
    isPaid: db.is_paid,
});

export const mapMonthlyFee = (db: any): MonthlyFee => ({
    id: db.id,
    profileId: db.profile_id,
    year: db.year,
    month: db.month,
    amount: Number(db.amount),
    status: db.status,
    paymentDate: db.payment_date || undefined,
    paymentMethod: db.payment_method || undefined,
    notes: db.notes || undefined,
});

export const mapFinancialTransaction = (db: any): FinancialTransaction => ({
    id: db.id,
    type: db.type,
    description: db.description,
    amount: Number(db.amount),
    category: db.category,
    date: db.date,
    paymentDate: db.payment_date || undefined,
    status: db.status,
    profileId: db.profile_id || undefined,
    provider: db.provider || undefined,
    expeditionId: db.expedition_id || undefined,
    source: db.source,
    notes: db.notes || undefined,
    attachmentUrl: db.attachment_url || undefined,
    monthlyFeeId: db.monthly_fee_id || undefined,
});

export const mapTask = (db: any): Task => ({
    id: db.id,
    expeditionId: db.expedition_id,
    title: db.title,
    description: db.description || undefined,
    assignedTo: db.assigned_to || undefined,
    status: db.status,
    priority: db.priority,
    category: db.category,
    dueDate: db.due_date || undefined,
});

export const mapBoat = (db: any): Boat => ({
    id: db.id,
    expeditionId: db.expedition_id,
    codeName: db.code_name,
    nickname: db.nickname || undefined,
});

export const mapTeam = (db: any): Team => ({
    id: db.id,
    expeditionId: db.expedition_id,
    boatId: db.boat_id || undefined,
    name: db.name,
    colorHex: db.color_hex,
    members: [], // loaded separately
});

export const mapChecklistItem = (db: any): ChecklistItem => ({
    id: db.id,
    expeditionId: db.expedition_id,
    category: db.category,
    name: db.name,
    quantity: db.quantity ? Number(db.quantity) : undefined,
    unit: db.unit || undefined,
    unitPrice: db.unit_price ? Number(db.unit_price) : undefined,
    totalPrice: db.total_price ? Number(db.total_price) : undefined,
    transactionId: db.transaction_id || undefined,
    isChecked: db.is_checked,
});

export const mapChecklistTemplate = (db: any): ChecklistTemplate => ({
    id: db.id,
    category: db.category,
    name: db.name,
    quantity: db.quantity ? Number(db.quantity) : undefined,
    unit: db.unit || undefined,
    unitPrice: db.unit_price ? Number(db.unit_price) : undefined,
    totalPrice: db.total_price ? Number(db.total_price) : undefined,
});

export const mapTShirtOrder = (db: any): TShirtOrder => ({
    id: db.id,
    expeditionId: db.expedition_id,
    profileId: db.profile_id,
    size: db.size,
    quantity: db.quantity,
    price: db.price ? Number(db.price) : undefined,
    hasPaid: db.has_paid,
});


// -- Mappers from App to DB (camelCase -> snake_case) -- //

export const unmapProfile = (app: Omit<Profile, 'id'> | Partial<Profile>): any => ({
    name: app.name,
    type: app.type,
    phone: app.phone,
    email: app.email,
    drinks_alcohol: app.drinksAlcohol,
    is_active: app.isActive,
});

export const unmapExpedition = (app: Omit<Expedition, 'id'> | Partial<Expedition>): any => ({
    name: app.name,
    year: app.year,
    start_date: app.startDate,
    end_date: app.endDate,
    location: app.location,
});

export const unmapTransaction = (app: Omit<Transaction, 'id'> | Partial<Transaction>): any => ({
    expedition_id: app.expeditionId,
    description: app.description,
    amount: app.amount,
    unit_price: app.unitPrice,
    total_price: app.totalPrice,
    purchase_date: app.purchaseDate,
    purchased_by: app.purchasedBy,
    category: app.category,
    is_expense: app.isExpense,
    is_for_drinkers_only: app.isForDrinkersOnly,
    is_paid: app.isPaid,
});

export const unmapMonthlyFee = (app: Omit<MonthlyFee, 'id'> | Partial<MonthlyFee>): any => ({
    profile_id: app.profileId,
    year: app.year,
    month: app.month,
    amount: app.amount,
    status: app.status,
    payment_date: app.paymentDate,
    payment_method: app.paymentMethod,
    notes: app.notes,
});

export const unmapFinancialTransaction = (app: Omit<FinancialTransaction, 'id'> | Partial<FinancialTransaction>): any => ({
    type: app.type,
    description: app.description,
    amount: app.amount,
    category: app.category,
    date: app.date,
    payment_date: app.paymentDate,
    status: app.status,
    profile_id: app.profileId,
    provider: app.provider,
    expedition_id: app.expeditionId,
    source: app.source,
    notes: app.notes,
    attachment_url: app.attachmentUrl,
    monthly_fee_id: app.monthlyFeeId,
});

export const unmapTask = (app: Omit<Task, 'id'> | Partial<Task>): any => ({
    expedition_id: app.expeditionId,
    title: app.title,
    description: app.description,
    assigned_to: app.assignedTo,
    status: app.status,
    priority: app.priority,
    category: app.category,
    due_date: app.dueDate,
});

export const unmapBoat = (app: Omit<Boat, 'id'> | Partial<Boat>): any => ({
    expedition_id: app.expeditionId,
    code_name: app.codeName,
    nickname: app.nickname,
});

export const unmapTeam = (app: Omit<Team, 'id'> | Partial<Team>): any => ({
    expedition_id: app.expeditionId,
    boat_id: app.boatId,
    name: app.name,
    color_hex: app.colorHex,
});

export const unmapChecklistItem = (app: Omit<ChecklistItem, 'id'> | Partial<ChecklistItem>): any => ({
    expedition_id: app.expeditionId,
    category: app.category,
    name: app.name,
    quantity: app.quantity,
    unit: app.unit,
    unit_price: app.unitPrice,
    total_price: app.totalPrice,
    transaction_id: app.transactionId,
    is_checked: app.isChecked,
});

export const unmapChecklistTemplate = (app: Omit<ChecklistTemplate, 'id'> | Partial<ChecklistTemplate>): any => ({
    category: app.category,
    name: app.name,
    quantity: app.quantity,
    unit: app.unit,
    unit_price: app.unitPrice,
    total_price: app.totalPrice,
});

export const unmapTShirtOrder = (app: Omit<TShirtOrder, 'id'> | Partial<TShirtOrder>): any => ({
    expedition_id: app.expeditionId,
    profile_id: app.profileId,
    size: app.size,
    quantity: app.quantity,
    price: app.price,
    has_paid: app.hasPaid,
});

// A helper to strip undefined keys before update
export const cleanUpdate = (obj: any) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};
