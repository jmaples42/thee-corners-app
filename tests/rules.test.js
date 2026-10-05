// Run with: npm run test:rules   (needs Java; starts the Firestore emulator)
const { test, before, after, beforeEach } = require('node:test');
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertSucceeds, assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch, collection, query, where, arrayUnion,
} = require('firebase/firestore');

const A = { uid: 'alice', phone: '+15550000001' };
const B = { uid: 'bob', phone: '+15550000002' };
const C = { uid: 'carol', phone: '+15550000003' };
const CORNER = 'corner1';
let env;

const as = (u) => env.authenticatedContext(u.uid, { phone_number: u.phone }).firestore();
const inviteId = (phone, cornerId = CORNER) => `${phone}_${cornerId}`;
const invite = (phone, extra = {}) => ({
  cornerId: CORNER, cornerName: 'Test Corner', phone,
  invitedByUid: A.uid, invitedByUsername: 'alice', createdAt: 1, ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'rules-test',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8') },
  });
});
after(() => env.cleanup());

// Alice owns CORNER (alone); Alice has invited Bob.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'corners', CORNER), {
      name: 'Test Corner', ownerUid: A.uid, memberUids: [A.uid], lastActivityAt: 1,
    });
    await setDoc(doc(db, 'invites', inviteId(B.phone)), invite(B.phone));
  });
});

test('creator can create a corner alone, but not with other members pre-added', async () => {
  await assertSucceeds(setDoc(doc(as(C), 'corners', 'new1'), { name: 'x', memberUids: [C.uid] }));
  await assertFails(setDoc(doc(as(C), 'corners', 'new2'), { name: 'x', memberUids: [C.uid, A.uid] }));
});

test('a member can invite by phone; a non-member cannot', async () => {
  await assertSucceeds(setDoc(doc(as(A), 'invites', inviteId(C.phone)), invite(C.phone)));
  await assertFails(setDoc(doc(as(C), 'invites', inviteId(C.phone)), invite(C.phone, { invitedByUid: C.uid })));
});

test('invites must be well formed', async () => {
  const db = as(A);
  await assertFails(setDoc(doc(db, 'invites', 'wrong-id'), invite(C.phone)));                      // id mismatch
  await assertFails(setDoc(doc(db, 'invites', inviteId('555')), invite('555')));                   // not E.164
  await assertFails(setDoc(doc(db, 'invites', inviteId(C.phone)), invite(C.phone, { invitedByUid: B.uid }))); // forged inviter
  await assertFails(setDoc(doc(db, 'invites', inviteId(C.phone)), invite(C.phone, { extra: 1 })));// extra field
});

test('the invitee sees their own invites, and nobody else does', async () => {
  const mine = await assertSucceeds(getDocs(query(collection(as(B), 'invites'), where('phone', '==', B.phone))));
  if (mine.size !== 1) throw new Error(`expected 1 invite, got ${mine.size}`);
  await assertFails(getDocs(query(collection(as(C), 'invites'), where('phone', '==', B.phone))));
  await assertFails(getDoc(doc(as(C), 'invites', inviteId(B.phone))));
  await assertSucceeds(getDoc(doc(as(A), 'invites', inviteId(B.phone)))); // inviter can see it
});

test('accepting: invitee adds exactly themselves and deletes the invite', async () => {
  const db = as(B);
  const batch = writeBatch(db);
  batch.update(doc(db, 'corners', CORNER), { memberUids: arrayUnion(B.uid) });
  batch.delete(doc(db, 'invites', inviteId(B.phone)));
  await assertSucceeds(batch.commit());
});

test('no invite, no joining', async () => {
  await assertFails(updateDoc(doc(as(C), 'corners', CORNER), { memberUids: arrayUnion(C.uid) }));
});

test("an invitee cannot add someone else, or add themselves plus others", async () => {
  await assertFails(updateDoc(doc(as(B), 'corners', CORNER), { memberUids: arrayUnion(C.uid) }));
  await assertFails(updateDoc(doc(as(B), 'corners', CORNER), { memberUids: arrayUnion(B.uid, C.uid) }));
  await assertFails(updateDoc(doc(as(B), 'corners', CORNER), { memberUids: [B.uid] })); // replaces members
});

test('an invitee cannot change anything but membership', async () => {
  await assertFails(updateDoc(doc(as(B), 'corners', CORNER), { memberUids: arrayUnion(B.uid), name: 'hijacked' }));
});

test('an invite for another number does not let you in', async () => {
  await assertFails(updateDoc(doc(as(C), 'corners', CORNER), { memberUids: arrayUnion(C.uid) }));
});

test('a full corner (5) cannot take a 6th member', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), 'corners', CORNER), { memberUids: [A.uid, 'u2', 'u3', 'u4', 'u5'] });
  });
  await assertFails(updateDoc(doc(as(B), 'corners', CORNER), { memberUids: arrayUnion(B.uid) }));
});

test('members cannot add people directly (consent), but can still bump activity', async () => {
  await assertFails(updateDoc(doc(as(A), 'corners', CORNER), { memberUids: arrayUnion(C.uid) }));
  await assertSucceeds(updateDoc(doc(as(A), 'corners', CORNER), { lastActivityAt: 2 }));
});

test('decline: invitee or inviter can delete the invite; a stranger cannot', async () => {
  await assertFails(deleteDoc(doc(as(C), 'invites', inviteId(B.phone))));
  await assertSucceeds(deleteDoc(doc(as(B), 'invites', inviteId(B.phone))));
});

test('inviter can cancel an invite', async () => {
  await assertSucceeds(deleteDoc(doc(as(A), 'invites', inviteId(B.phone))));
});

test('existing behavior: only members can read a corner', async () => {
  await assertSucceeds(getDoc(doc(as(A), 'corners', CORNER)));
  await assertFails(getDoc(doc(as(C), 'corners', CORNER)));
});
