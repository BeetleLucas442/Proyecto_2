const v = require('../utils/validate');

exports.login = (b) => {
  const e = [];
  v.string(b, 'identifier', e, { max: 255 });
  v.string(b, 'password', e, { max: 255 });
  return e;
};
exports.userCreate = (b) => {
  const e = [];
  v.email(b, 'email', e);
  v.string(b, 'username', e, { min: 3, max: 50 });
  v.string(b, 'password', e, { min: 4, max: 255 });
  v.phone(b, 'phone', e);
  return e;
};
exports.userUpdate = (b) => {
  const e = [];
  v.email(b, 'email', e);
  v.string(b, 'username', e, { min: 3, max: 50 });
  if (!v.blank(b.password)) v.string(b, 'password', e, { min: 4, max: 255 });
  v.phone(b, 'phone', e);
  return e;
};
exports.category = (b) => { const e = []; v.string(b, 'name', e, { max: 50 }); return e; };
exports.eventCreate = (b) => {
  const e = [];
  v.string(b, 'title', e, { max: 150 });
  v.string(b, 'description', e);
  v.futureDate(b, 'event_date', e);
  v.string(b, 'venue', e, { max: 150 });
  v.string(b, 'address', e, { max: 255 });
  v.intId(b, 'creator_id', e);
  v.intId(b, 'category_id', e);
  return e;
};
exports.eventUpdate = (b) => {
  const e = exports.eventCreate(b).filter((x) => x.field !== 'creator_id'); // el creador no cambia
  return e;
};
exports.participant = (b) => {
  const e = [];
  v.string(b, 'name', e, { max: 150 });
  v.string(b, 'role', e, { max: 80 });
  return e;
};
exports.ticket = (b) => {
  const e = [];
  v.intId(b, 'user_id', e);
  v.intId(b, 'event_id', e);
  return e;
};
