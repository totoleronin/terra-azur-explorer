-- Ajout colonne icone + mise à jour missions Baous
alter table missions add column if not exists icone text;

update missions set icone = '🏠' where id = 'baous-chapelle';
update missions set icone = '🌉' where id = 'baous-vue-mer';
update missions set icone = '🪧' where id = 'baous-falaises';
update missions set icone = '🪨' where id = 'baous-oliviers';
update missions set icone = '🌲' where id = 'baous-chenes';
update missions set icone = '🏘️' where id = 'saint-jeannet-village';
