-- Disabilita temporaneamente le chiavi esterne
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM patio;
ALTER TABLE patio AUTO_INCREMENT = 1;

DELETE FROM patio_prevnlot;
ALTER TABLE patio_prevnlot AUTO_INCREMENT = 1;

DELETE FROM dryer;
ALTER TABLE dryer AUTO_INCREMENT = 1;

DELETE FROM dryer_prevnlot;
ALTER TABLE dryer_prevnlot AUTO_INCREMENT = 1;

DELETE FROM fermentation;
ALTER TABLE fermentation AUTO_INCREMENT = 1;

DELETE FROM fermentation_prevnlot;
ALTER TABLE fermentation_prevnlot AUTO_INCREMENT = 1;

DELETE FROM newlot;
ALTER TABLE newlot AUTO_INCREMENT = 1;

-- Riattiva i vincoli
SET FOREIGN_KEY_CHECKS = 1;
