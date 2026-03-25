// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sessionMiddleware from "./middleware/session.js";
import connection from "./db.js";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import * as XLSX from "xlsx";

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

// Middleware per il parsing del body delle richieste
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.options("*", cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());


// Configurazione della sessione
app.use(sessionMiddleware);

app.use((req, res, next) => {
  if (req.session) {
    // console.log("Session:", req.session);
  } else {
    console.log("No session");
  }
  next();
});

// Servire i file statici della app React
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: "uploads/" });


// Endpoint per ottenere l'utente autenticato
app.get("/api/me", (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Non autenticato" });
  }
});

// Endpoint di esempio per il register
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("Request Body:", req.body); // Logga il body della richiesta

  if (!email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Verifica se l'email esiste già
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Cifra la password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea un nuovo utente
    const [result] = await connection.execute(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, role],
    );

    console.log("Affected Rows:", result.affectedRows);
    console.log("Insert ID:", result.insertId);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint per il login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.error("Errore salvataggio sessione:", err);
          return res.status(500).json({ message: "Server error" });
        }
        console.log("Session saved:", req.session);
        res.status(200).json({ message: "Login successful", user });
      });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint per il logout
app.post("/logout", (req, res) => {
  if (req.session.user) {
    console.log("Logging out user:", req.session.user);
    req.session.destroy((err) => {
      if (err) {
        console.error("Errore durante il logout:", err);
        return res.status(500).send({ message: "Errore durante il logout" });
      }
      res.clearCookie("connect.sid"); // Cancella il cookie di sessione
      console.log("Logout effettuato con successo");
      res.status(200).send({ message: "Logout effettuato con successo" });
    });
  } else {
    console.log("Nessuna sessione attiva");
    res.status(400).send({ message: "Nessuna sessione attiva" });
  }
});

//GESTIONE STRUTTURA//
// Endpoint per ottenere le fattorie
app.get("/api/farm", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM farm");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

// Endpoint per ottenere gli elementi della farm
app.get("/api/elements", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM elements");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

// Endpoint per ottenere i plots della farm
app.get("/api/plots", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM plots");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

// Endpoint per ottenere le statistiche di una farm
app.get("/api/farm/:id/stats", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await connection.query(
      `SELECT 
        COUNT(*) AS nPlots,
        COALESCE(SUM(surface), 0) AS totalSurface,
        COALESCE(ROUND(AVG(YEAR(CURDATE()) - age)), 0) AS avgAge
       FROM plots WHERE farmId = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// Endpoint per modificare il nome di una farm
app.patch("/api/farm/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await connection.query("UPDATE farm SET name = ? WHERE id = ?", [name, id]);
    res.json({ message: "Farm aggiornata" });
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// Endpoint per ottenere gli utenti
app.get("/api/users", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM users");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

// Endpoint per aggiungere una nuova farm
app.post("/api/farm", async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await connection.query(
      "INSERT INTO farm (name) VALUES (?)",
      [name],
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error("Error adding data:", err);
    res.status(500).send("Errore durante l'aggiunta dei dati");
  }
});

// Endpoint per eliminare una farm e i relativi elementi
app.delete("/api/farm/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Inizia una transazione
    await connection.beginTransaction();

    // Elimina gli elementi collegati alla farm
    await connection.query("DELETE FROM elementi WHERE farmId = ?", [id]);

    // Elimina i plots collegati alla farm
    await connection.query("DELETE FROM plots WHERE farmId = ?", [id]);

    // Elimina la farm
    await connection.query("DELETE FROM farm WHERE id = ?", [id]);

    // Conferma la transazione
    await connection.commit();

    res.status(200).send("Farm e relativi elementi eliminati con successo");
  } catch (err) {
    // In caso di errore, annulla la transazione
    await connection.rollback();

    console.error("Error deleting farm and its elements:", err);
    res
      .status(500)
      .send("Errore durante l'eliminazione della farm e dei suoi elementi");
  }
});

// Endpoint per eliminare una elemento della struttura
app.delete("/api/elements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Inizia una transazione
    await connection.beginTransaction();

    // Elimina l'elemento specifico dal database usando il suo id
    const [result] = await connection.query(
      "DELETE FROM elements WHERE id = ?",
      [id],
    );

    // Verifica se l'elemento è stato eliminato
    if (result.affectedRows === 0) {
      // Se non c'è nessun elemento con l'id specificato
      await connection.rollback(); // Rollback della transazione in caso di errore
      return res.status(404).send("Element non trovato");
    }

    // Commit della transazione se l'elemento è stato eliminato correttamente
    await connection.commit();
    res.status(200).send("Element eliminato con successo");
  } catch (err) {
    await connection.rollback(); // Rollback della transazione in caso di errore
    console.error("Error deleting element:", err);
    res.status(500).send("Errore durante l'eliminazione dell'elemento");
  }
});

// Endpoint per eliminare un plot della farm
app.delete("/api/plots/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Inizia una transazione
    await connection.beginTransaction();

    // Elimina il plot specifico dal database usando il suo id
    const [result] = await connection.query("DELETE FROM plots WHERE id = ?", [
      id,
    ]);

    // Verifica se il plot è stato eliminato
    if (result.affectedRows === 0) {
      // Se non c'è nessun plot con l'id specificato
      await connection.rollback(); // Rollback della transazione in caso di errore
      return res.status(404).send("Element non trovato");
    }

    // Commit della transazione se il plot è stato eliminato correttamente
    await connection.commit();
    res.status(200).send("Plot eliminato con successo");
  } catch (err) {
    await connection.rollback(); // Rollback della transazione in caso di errore
    console.error("Error deleting plot:", err);
    res.status(500).send("Errore durante l'eliminazione del plot");
  }
});

// Endpoint per eliminare uno user
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Inizia una transazione
    await connection.beginTransaction();

    // Elimina l'elemento specifico dal database usando il suo id
    const [result] = await connection.query("DELETE FROM users WHERE id = ?", [
      id,
    ]);

    // Verifica se lo user è stato eliminato
    if (result.affectedRows === 0) {
      // Se non c'è nessun user con l'id specificato
      await connection.rollback(); // Rollback della transazione in caso di errore
      return res.status(404).send("User non trovato");
    }

    // Commit della transazione se lo user è stato eliminato correttamente
    await connection.commit();
    res.status(200).send("User eliminato con successo");
  } catch (err) {
    await connection.rollback(); // Rollback della transazione in caso di errore
    console.error("Error deleting user:", err);
    res.status(500).send("Errore durante l'eliminazione dello user");
  }
});

// Endpoint per aggiungere elementi alla farm
app.post("/api/elements", async (req, res) => {
  const { element, name, notes, farmId } = req.body;
  try {
    const [result] = await connection.query(
      "INSERT INTO elements (element, name, notes, farmId) VALUES (?, ?, ?, ?)",
      [element, name, notes, farmId],
    );
    res.status(201).json({ id: result.insertId, element, name, notes, farmId });
  } catch (err) {
    console.error("Error inserting element:", err);
    res.status(500).send("Errore durante l'inserimento dell'elemento");
  }
});

// Endpoint per aggiungere plots alla farm
app.post("/api/plots", async (req, res) => {
  const {
    name,
    codename,
    variety,
    ncovas,
    distance,
    surface,
    age,
    state,
    irrigation,
    renda_forecast,
    farmId,
  } = req.body;

  console.log("Dati ricevuti dal client:", req.body);

  try {
    const [result] = await connection.query(
      "INSERT INTO plots (name, codename, variety, ncovas, distance, surface, age, state, irrigation, renda_forecast, farmId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        codename,
        variety,
        ncovas,
        distance,
        surface,
        age,
        state,
        irrigation,
        renda_forecast,
        farmId,
      ],
    );

    console.log("Risultato dell'inserimento nel database:", result);

    res.status(201).json({
      id: result.insertId,
      name,
      codename,
      variety,
      ncovas,
      distance,
      surface,
      age,
      state,
      irrigation,
      renda_forecast,
      farmId,
    });
  } catch (err) {
    console.error("Errore durante l'inserimento del plot nel database:", err);
    res.status(500).send("Errore durante l'inserimento del plot");
  }
});

// Endpoint per modificare plots
app.patch("/api/plots/:id", async (req, res) => {
  const { id } = req.params;
  const { state, irrigation, renda_forecast } = req.body;
  try {
    await connection.query(
      "UPDATE plots SET state = ?, irrigation = ?, renda_forecast = ? WHERE id = ?",
      [state || null, irrigation || null, renda_forecast || null, id],
    );
    res.status(200).json({ message: "Plot aggiornato con successo" });
  } catch (err) {
    console.error("Errore PATCH /api/plots/:id", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// Endpoint per l'upload degli appezzamenti tramite file Excel
app.post("/api/excelplots", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file?.path;
    const farmId = req.body.farmId;

    if (!filePath) {
      return res.status(400).json({ message: "Nessun file ricevuto." });
    }

    if (!farmId) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Farm ID mancante." });
    }

    // Leggi il file Excel
    const buffer = fs.readFileSync(req.file.path);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log("Righe importate:", rows.length);

    // Validazione base: almeno una riga e colonne necessarie
    const requiredFields = [
      "name",
      "codename",
      "variety",
      "ncovas",
      "distance",
      "surface",
      "age",
      "state",
      "irrigation",
    ];

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Il file Excel è vuoto." });
    }

    // Controlla che tutte le colonne esistano
    const missing = requiredFields.filter((field) => !(field in rows[0]));
    if (missing.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: `Colonne mancanti nel file: ${missing.join(", ")}`,
      });
    }

    // Inserisci i dati
    for (const row of rows) {
      const {
        name,
        codename,
        variety,
        ncovas,
        distance,
        surface,
        age,
        state,
        irrigation,
        renda_forecast = null,
      } = row;

      await connection.query(
        `INSERT INTO plots 
         (name, codename, variety, ncovas, distance, surface, age, state, irrigation, renda_forecast, farmId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          codename,
          variety,
          ncovas,
          distance,
          surface,
          age,
          state,
          irrigation,
          renda_forecast,
          farmId,
        ],
      );
    }

    fs.unlinkSync(filePath);
    res.json({
      message: `Importazione completata (${rows.length} appezzamenti).`,
    });
  } catch (error) {
    console.error("Errore durante l'importazione Excel:", error);
    res.status(500).json({
      message: "Errore interno durante l'elaborazione del file Excel.",
    });
  }
});

// Endpoint per aggiungere un nuovo lotto
app.post("/api/newlot", async (req, res) => {
  const { plot, volume, date, method, type } = req.body;

  const getLastNlotQuery =
    "SELECT newlot_nLot FROM newlot ORDER BY newlot_nLot DESC LIMIT 1";
  const insertNewLotQuery =
    "INSERT INTO newlot (plot, volume, date, method, type, worked, newlot_nLot) VALUES (?, ?, ?, ?, ?, ?, ?)";

  try {
    const [lastNlotResult] = await connection.query(getLastNlotQuery);
    let lastNlot;

    if (lastNlotResult.length === 0) {
      lastNlot = "H00000"; // Valore iniziale se nessun risultato è trovato
    } else {
      lastNlot = lastNlotResult[0].newlot_nLot;
    }

    const lastNumber = parseInt(lastNlot.substring(1)) + 1;
    const newNlot = "H" + lastNumber.toString().padStart(5, "0");

    const newWorked = 0;

    const values = [plot, volume, date, method, type, newWorked, newNlot];
    const [result] = await connection.query(insertNewLotQuery, values);

    console.log("Risultato dell'inserimento:", result);

    res.status(201).json({
      id: result.insertId,
      plot,
      volume,
      date,
      method,
      type,
      worked: newWorked,
      newlot_nLot: newNlot,
    });
  } catch (err) {
    console.error("Errore nell'inserimento dei dati:", err);
    res.status(500).send("Errore nell'inserimento del nuovo lotto");
  }
});

// Endpoint per ottenere i nuovi lotti
app.get("/api/newlot", async (req, res) => {
  const sql =
    "SELECT id, date, plot, volume, method, type, worked, newlot_nLot FROM newlot WHERE worked = 0 ORDER BY date DESC";

  try {
    const [results] = await connection.query(sql);
    res.json(results);
  } catch (err) {
    console.error("Errore nel recupero dei nuovi lotti:", err);
    res.status(500).send("Errore nel recupero dei nuovi lotti");
  }
});

//CARDS in DASHBOARD//
// Endpoint per ottenere i dati del patio e i plot da newlot
app.get("/api/patiocard", async (req, res) => {
  try {
    const [results] = await connection.query(
      `SELECT 
  p.id,
  p.date,
  p.name,
  CASE
    WHEN p.status = 'active' THEN p.volume
    WHEN p.status = 'fermented' THEN p.volume
    WHEN p.status = 'split' THEN p.partial_volume
    ELSE NULL
  END AS volume,
  p.type,
  p.status,
  GROUP_CONCAT(n.plot SEPARATOR ', ') as plots
FROM patio p
JOIN patio_prevnlot pp ON p.id = pp.patio_id
JOIN newlot n ON n.newlot_nLot = pp.prev_nLot_newlot
WHERE p.status != 'finished'
GROUP BY p.id;`,
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

// Endpoint per ottenere i dati del dryer e i plot da newlot
app.get("/api/dryercard", async (req, res) => {
  try {
    const query = `
      SELECT 
        d.id,
        d.date,
        d.dryer AS name,
        d.volume,
        GROUP_CONCAT(DISTINCT p.type SEPARATOR ', ') AS type,
        GROUP_CONCAT(DISTINCT nl.plot SEPARATOR ', ') AS plots
      FROM dryer d
      JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
      JOIN patio p ON dp.prev_nLot_patio = p.patio_nLot
      JOIN patio_prevnlot pp ON p.id = pp.patio_id
      JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      WHERE d.status != 'finished'
      GROUP BY d.id;
    `;
    const [results] = await connection.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore nella route /api/dryercard:", err);
    res.status(500).send("Errore durante il recupero dei dati del dryer");
  }
});

// Endpoint per ottenere i dati della fermentation e i plot da newlot
app.get("/api/fermentationcard", async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id,
        f.date,
        f.fermentation_nLot AS name,
        f.volume,
        f.method AS type,
        GROUP_CONCAT(DISTINCT nl.plot SEPARATOR ', ') AS plots
      FROM fermentation f
      JOIN fermentation_prevnlot fp ON f.id = fp.fermentation_id
      JOIN patio p ON fp.prev_nLot_patio = p.patio_nlot
      JOIN patio_prevnlot pp ON p.id = pp.patio_id
      JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      WHERE f.worked = 0
      GROUP BY f.id;
    `;

    const [results] = await connection.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore /api/fermentationcard:", err);
    res.status(500).send("Errore recupero fermentation card");
  }
});

// Endpoint per ottenere i dati della resting (tulha) e i plot da newlot
app.get("/api/restcard", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.dateIn AS date,
        r.tulha AS name,
        r.volume,
        GROUP_CONCAT(DISTINCT p.type SEPARATOR ', ') AS type,
        GROUP_CONCAT(DISTINCT nl.plot SEPARATOR ', ') AS plots
      FROM rest r
      JOIN rest_prevnlot rp ON r.id = rp.rest_id
      JOIN dryer d ON rp.prev_nLot_dryer = d.dryer_nLot
      JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
      JOIN patio p ON dp.prev_nLot_patio = p.patio_nlot
      JOIN patio_prevnlot pp ON p.id = pp.patio_id
      JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      WHERE r.status != 'finished'
      GROUP BY r.id;
    `;

    const [results] = await connection.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore /api/restcard:", err);
    res.status(500).send("Errore recupero rest card");
  }
});

// GET /api/stockingcard
app.get("/api/stockingcard", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.date,
        c.cleaning_nLot AS name,
        c.bags,
        c.deposit,
        GROUP_CONCAT(DISTINCT nl.plot SEPARATOR ', ') AS plots,
        GROUP_CONCAT(DISTINCT p.type SEPARATOR ', ') AS type
      FROM cleaning c
      JOIN cleaning_prevnlot cp ON c.id = cp.cleaning_id
      JOIN rest r ON cp.prev_nLot_rest = r.rest_nLot
      JOIN rest_prevnlot rp ON r.id = rp.rest_id
      LEFT JOIN patio p ON rp.prev_nLot_patio = p.patio_nLot
      LEFT JOIN dryer d ON rp.prev_nLot_dryer = d.dryer_nLot
      LEFT JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
      LEFT JOIN patio p2 ON dp.prev_nLot_patio = p2.patio_nLot
      LEFT JOIN patio_prevnlot pp ON COALESCE(p.id, p2.id) = pp.patio_id
      LEFT JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      GROUP BY c.id, c.date, c.cleaning_nLot, c.bags, c.deposit
      ORDER BY c.date DESC;
    `;
    const [results] = await connection.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore /api/stockingcard:", err);
    res.status(500).send("Errore recupero stockingcard");
  }
});

// Endpoint per ottenere i patii per la dashboard
app.get("/api/patio", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM patio");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Errore durante il recupero dei dati");
  }
});

//Endpoint per aggiungere un nuovo lotto nel patio
app.post("/api/patio", async (req, res) => {
  const data = req.body;
  console.log("POST ricevuto:", data);

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const getLastNlotQuery =
    "SELECT patio_nLot FROM patio ORDER BY patio_nLot DESC LIMIT 1";
  const insertPatioQuery = `INSERT INTO patio (name, volume, type, date, status, fermented, depulped, demucil, centrifug, patio_nLot) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const selectNewPatioQuery = "SELECT * FROM patio WHERE id = ?";

  try {
    await connection.beginTransaction();

    // Ottenere l'ultimo patio_nLot
    const [lastNlotResult] = await connection.query(getLastNlotQuery);
    let lastNlot =
      lastNlotResult.length === 0 ? "P00000" : lastNlotResult[0].patio_nLot;
    let lastNumber = parseInt(lastNlot.substring(1)) + 1;

    const patioRecords = [];

    for (const entry of data) {
      const {
        name,
        volume,
        type,
        date,
        status = "active",
        fermented = 0,
        depulped = 0, // ← aggiungi
        demucil = 0, // ← aggiungi
        centrifug = 0, // ← aggiungi
      } = entry;

      const newNlot = "P" + lastNumber.toString().padStart(5, "0");
      lastNumber++;

      const [result] = await connection.query(insertPatioQuery, [
        name,
        volume,
        type,
        date,
        status,
        fermented,
        depulped, // ← non serve più || 0 perché ha già default
        demucil,
        centrifug,
        newNlot,
      ]);

      // Dopo aver inserito, recupera il record dal db
      const [newPatio] = await connection.query(selectNewPatioQuery, [
        result.insertId,
      ]);
      patioRecords.push(newPatio[0]);
    }

    await connection.commit();

    const patioIds = patioRecords.map((p) => p.id);

    res
      .status(201)
      .json({ message: "Data inserted successfully", patioRecords, patioIds });
  } catch (err) {
    await connection.rollback();
    console.error("Error inserting data:", err);
    res.status(500).json({ error: "Error inserting data" });
  }
});

//Endpoint per modificare il valore worked del lotto
app.patch("/api/newlot/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Richiesta di aggiornamento ricevuta per il lotto con ID: ${id}`);

  try {
    const [result] = await connection.query(
      "UPDATE newlot SET worked = 1 WHERE id = ?",
      [id],
    );
    console.log(
      `Risultato dell'aggiornamento per il lotto con ID ${id}:`,
      result,
    );

    res.status(200).json({ message: "Lotto aggiornato con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento del lotto:", error);
    res.status(500).json({ error: "Errore nel server" });
  }
});

//Endpoint per aggiungere i dati in patio_prevnlot
app.post("/api/patio_prevnlot", async (req, res) => {
  console.log("Dati ricevuti:", req.body);
  try {
    const data = req.body; // Riceve un array di { patio_id, prev_nLot_newlot, prev_nLot_fermentation }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Dati non validi" });
    }

    const values = data.map(({ patio_id, prev_nLot_newlot }) => [
      patio_id,
      prev_nLot_newlot,
    ]);

    await connection.query(
      "INSERT INTO patio_prevnlot (patio_id, prev_nLot_newlot) VALUES ?",
      [values],
    );

    res.status(201).json({ message: "Dati inseriti con successo" });
  } catch (error) {
    console.error("Errore inserendo dati in patio_prevnlot:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

//Endpoint per modificare i lotti del patio partial_volume e status
app.patch("/api/patio/update-lots", async (req, res) => {
  const lots = req.body.lots;

  try {
    for (const lot of lots) {
      const { id, volumeUsed } = lot;

      const [existingRows] = await connection.query(
        "SELECT volume, partial_volume, status FROM patio WHERE id = ?",
        [id],
      );

      if (existingRows.length === 0) continue;

      const { volume, partial_volume, status } = existingRows[0];

      if (status === "active") {
        const remaining = volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = ? WHERE id = ?",
            ["split", remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }
      } else if (status === "split") {
        const remaining = partial_volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE patio SET partial_volume = ? WHERE id = ?",
            [remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }
      }
    }

    res.json({ message: "Lotti aggiornati con successo" });
  } catch (err) {
    console.error("Errore PATCH /api/patio/update-lots:", err);
    res.status(500).json({ error: "Errore durante l'aggiornamento dei lotti" });
  }
});

//Fermentation
// Endpoint per ottenere il valore di newlot_nLot
app.get("/api/trace/prev-nlot-newlot/:fermentation_nLot", async (req, res) => {
  const fermentation_nLot = req.params.fermentation_nLot;

  try {
    const [result] = await connection.query(
      `
      SELECT pprev.prev_nLot_newlot
      FROM fermentation f
      JOIN fermentation_prevnlot fprev ON f.id = fprev.fermentation_id
      JOIN patio p ON fprev.prev_nLot_patio = p.patio_nLot
      JOIN patio_prevnlot pprev ON p.id = pprev.patio_id
      WHERE f.fermentation_nLot = ?
      LIMIT 1
      `,
      [fermentation_nLot],
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Dato non trovato" });
    }

    res.status(200).json({ prev_nLot_newlot: result[0].prev_nLot_newlot });
  } catch (error) {
    console.error("Errore nel recupero:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Endpoint per ottenere i lotti di fermentazione attivi
app.get("/api/fermentation/active", async (req, res) => {
  try {
    const active = await connection.query(
      "SELECT * FROM fermentation WHERE worked = 0",
    );
    res.json(active[0]);
  } catch (err) {
    console.error("Errore nel recupero delle fermentazioni attive:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

// Endpoint per aggiungere i lotti di fermentazione
app.post("/api/fermentation", async (req, res) => {
  const { volume, date, type, timeIn, method, lots } = req.body;

  if (!volume || !date || !type || !timeIn || !method || !Array.isArray(lots)) {
    return res.status(400).json({ message: "Dati incompleti" });
  }

  try {
    await connection.beginTransaction();

    // 2.1 – genera nuovo fermentation_nlot
    const [last] = await connection.query(
      "SELECT fermentation_nLot FROM fermentation ORDER BY fermentation_nLot DESC LIMIT 1",
    );
    const lastNlot = last.length === 0 ? "F00000" : last[0].fermentation_nLot;
    const nextNum = parseInt(lastNlot.substring(1)) + 1;
    const newNlot = "F" + nextNum.toString().padStart(5, "0");

    // 2.2 – inserisci il record in `fermentation`
    const insertFermentationSQL = `
      INSERT INTO fermentation (volume, date, type, timeIn, method, fermentation_nLot)
      VALUES (?, ?, ?, ?, ?, ?)`;
    const [ins] = await connection.query(insertFermentationSQL, [
      volume,
      date,
      type,
      timeIn,
      method,
      newNlot,
    ]);

    const fermentationIds = ins.insertId;

    // 2.3 – per ogni lotto selezionato, inserisci in fermentation_prevnlot
    const insertPrev = `
      INSERT INTO fermentation_prevnLot (fermentation_id, prev_nLot_patio)
      VALUES (?, ?)`;
    console.log("Lots ricevuti:", lots);
    for (const lot of lots) {
      await connection.query(insertPrev, [
        fermentationIds,
        lot.prev_nLot_patio,
      ]);
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Data inserted successfully", fermentationIds });
  } catch (err) {
    await connection.rollback();
    console.error("Error inserting data:", err);
    res.status(500).json({ error: err.message, full: err });
  }
});

//Endpoint per aggiungere i dati in patio_prevnlot da fermentation
app.post("/api/patio_prevnlot_fermentation", async (req, res) => {
  console.log("Dati ricevuti:", req.body);
  try {
    const data = req.body; // Riceve un array di { patio_id, prev_nLot_newlot, prev_nLot_fermentation }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Dati non validi" });
    }

    const values = data.map(
      ({ patio_id, prev_nLot_newlot, prev_nLot_fermentation }) => [
        patio_id,
        prev_nLot_newlot,
        prev_nLot_fermentation,
      ],
    );

    await connection.query(
      "INSERT INTO patio_prevnlot (patio_id, prev_nLot_newlot, prev_nLot_fermentation) VALUES ?",
      [values],
    );

    res.status(201).json({ message: "Dati inseriti con successo" });
  } catch (error) {
    console.error("Errore inserendo dati in patio_prevnlot:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Enpoint per modificare il valore del volume di patio
app.patch("/api/patio/update-lots-fermentation", async (req, res) => {
  const lots = req.body.lots; // array di oggetti { id, volumeUsed }

  try {
    for (const lot of lots) {
      const { id, volumeUsed } = lot;

      // Recupera il lotto dal database
      const [existingRows] = await connection.query(
        "SELECT volume, partial_volume, status FROM patio WHERE id = ?",
        [id],
      );

      if (existingRows.length === 0) continue;

      const { volume, partial_volume, status } = existingRows[0];

      if (status === "active") {
        const remaining = volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = ? WHERE id = ?",
            ["split", remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }
      } else if (status === "split") {
        const remaining = partial_volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE patio SET partial_volume = ? WHERE id = ?",
            [remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE patio SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }
      } else {
        // Fallback per status inattesi
        console.warn(
          `⚠️  PATCH ignorato per patio con id=${id} e status=${status}`,
        );
      }
    }

    res.json({ message: "Lotti aggiornati con successo" });
  } catch (err) {
    console.error("Errore PATCH /api/patio/update-lots:", err);
    res.status(500).json({ error: "Errore durante l'aggiornamento dei lotti" });
  }
});

// Endpoint per modificare il valore worked del lotto di fermentazione
app.patch("/api/fermentation/update-lots", async (req, res) => {
  const { lots } = req.body;

  if (!Array.isArray(lots) || lots.length === 0) {
    return res.status(400).json({ error: "Nessun lotto da aggiornare." });
  }

  try {
    await connection.beginTransaction();

    for (const lot of lots) {
      const { id, dateOut, timeOut, worked } = lot;

      if (!id || !dateOut || !timeOut || typeof worked !== "number") {
        throw new Error(`Dati mancanti o malformati per il lotto con ID ${id}`);
      }

      await connection.query(
        `UPDATE fermentation
         SET dateOut = ?, timeOut = ?, worked = ?
         WHERE id = ?`,
        [dateOut, timeOut, worked, id],
      );
    }

    await connection.commit();
    res.status(200).json({ message: "Lotti aggiornati con successo." });
  } catch (error) {
    await connection.rollback();
    console.error("Errore durante il PATCH:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento dei lotti." });
  }
});

//DRYER
// Endpoint per ottenere i dati del dryer e i plot da newlot
app.get("/api/dryer", async (req, res) => {
  try {
    const query = `
      SELECT 
        d.id,
        d.date,
        d.dryer AS name,
        d.volume,
        d.partial_volume,
        d.status,
        d.dryer_nLot,
        GROUP_CONCAT(DISTINCT p.type ORDER BY p.type SEPARATOR ', ') AS type,
        GROUP_CONCAT(DISTINCT nl.plot ORDER BY nl.plot SEPARATOR ', ') AS plots
      FROM dryer d
      LEFT JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
      LEFT JOIN patio p ON dp.prev_nLot_patio = p.patio_nLot
      LEFT JOIN patio_prevnlot pp ON p.id = pp.patio_id
      LEFT JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      GROUP BY d.id, d.date, d.dryer, d.volume, d.partial_volume, d.status, d.dryer_nLot;
    `;
    const [results] = await connection.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore nella route /api/dryer:", err);
    res.status(500).send("Errore durante il recupero dei dati del dryer");
  }
});

//Endpoint per aggiungere i dati in dryer
app.post("/api/dryer", async (req, res) => {
  const { dryer, volume, date, timeIn, lots } = req.body;
  // lots: array di { prev_nLot_patio, volume } fornito dal frontend

  if (!dryer || !volume || !date || !timeIn || !Array.isArray(lots)) {
    return res.status(400).json({ message: "Dati incompleti" });
  }

  try {
    await connection.beginTransaction();

    // 2.1 – genera nuovo dryer_nlot
    const [last] = await connection.query(
      "SELECT dryer_nLot FROM dryer ORDER BY dryer_nLot DESC LIMIT 1",
    );
    const lastNlot = last.length === 0 ? "D00000" : last[0].dryer_nLot;
    const nextNum = parseInt(lastNlot.substring(1)) + 1;
    const newNlot = "D" + nextNum.toString().padStart(5, "0");

    // 2.2 – inserisci il record in `dryer`
    const insertDryerSQL = `
      INSERT INTO dryer (dryer, volume, date, timeIn, dryer_nLot)
      VALUES (?, ?, ?, ?, ?)`;
    const [ins] = await connection.query(insertDryerSQL, [
      dryer,
      volume,
      date,
      timeIn,
      newNlot,
    ]);

    const dryerId = ins.insertId;

    // 2.3 – per ogni lotto selezionato, inserisci in dryer_prevnlot
    const insertPrev = `
      INSERT INTO dryer_prevnLot (dryer_id, prev_nLot_patio, volume)
      VALUES (?, ?, ?)`;
    for (const lot of lots) {
      await connection.query(insertPrev, [
        dryerId,
        lot.prev_nLot_patio,
        lot.volume,
      ]);
    }

    await connection.commit();
    res.status(201).json({
      message: "Dryer registrato con successo",
      dryerId,
      dryer_nLot: newNlot,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Errore in POST /api/dryer:", err);
    res.status(500).json({ message: "Errore interno" });
  }
});

//TULHA
// Endpoint per ottenere i dati della tulha
app.get("/api/rest", async (req, res) => {
  try {
    const query = `
      SELECT
        r.id,
        r.dateIn,
        r.tulha AS name,
        r.volume,
        GROUP_CONCAT(DISTINCT p.type SEPARATOR ', ') AS type,
        GROUP_CONCAT(DISTINCT nl.plot SEPARATOR ', ') AS plots,
        MAX(CASE WHEN p.type = 'fermented' THEN 1 ELSE 0 END) AS fermented
      FROM rest r
      JOIN rest_prevnlot rp ON r.id = rp.rest_id
      LEFT JOIN patio p ON rp.prev_nLot_patio = p.patio_nLot
      LEFT JOIN patio_prevnlot pp ON p.id = pp.patio_id
      LEFT JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
      GROUP BY r.id
      ORDER BY r.dateIn DESC;
    `;

    const [results] = await connection.query(query);

    // normalizziamo fermented
    const normalized = results.map((r) => ({
      ...r,
      fermented: r.fermented === 1 ? "yes" : "no",
    }));

    res.status(200).json(normalized);
  } catch (err) {
    console.error("Errore GET /api/rest:", err);
    res.status(500).send("Errore durante il recupero dei dati rest");
  }
});

//Endpoint per il post dei dati in rest (tulha)
app.post("/api/rest", async (req, res) => {
  const { tulha, volume, dateIn, timeIn, lots } = req.body;

  if (!tulha || !volume || !dateIn || !timeIn || !Array.isArray(lots)) {
    return res.status(400).json({ message: "Dati incompleti" });
  }

  try {
    await connection.beginTransaction();

    // genera nuovo rest_nLot
    const [last] = await connection.query(
      "SELECT rest_nLot FROM rest ORDER BY rest_nLot DESC LIMIT 1",
    );

    const lastNlot = last.length === 0 ? "R00000" : last[0].rest_nLot;
    const nextNum = parseInt(lastNlot.substring(1)) + 1;
    const newNlot = "R" + nextNum.toString().padStart(5, "0");

    // inserimento REST
    const [ins] = await connection.query(
      `INSERT INTO rest 
       (tulha, volume, dateIn, timeIn, rest_nLot)
       VALUES (?, ?, ?, ?, ?)`,
      [tulha, volume, dateIn, timeIn, newNlot],
    );

    const restId = ins.insertId;

    // inserimento PREV LOT
    const insertPrev = `
      INSERT INTO rest_prevnlot
      (rest_id, prev_nLot_dryer, prev_nLot_patio)
      VALUES (?, ?, ?)
    `;

    for (const lot of lots) {
      const dryer = lot.prev_nLot_dryer || null;
      const patio = lot.prev_nLot_patio || null;

      // 🔒 blocca inserimenti sporchi
      if (!dryer && !patio) continue;

      await connection.query(insertPrev, [restId, dryer, patio]);
    }

    await connection.commit();

    res.status(201).json({
      message: "Rest registrato con successo",
      restId,
      rest_nLot: newNlot,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Errore POST /api/rest:", err);
    res.status(500).json({ message: "Errore interno" });
  }
});

//Endpoint per modificare i lotti del dryer partial_volume e status
app.patch("/api/rest/update-lots", async (req, res) => {
  const { lots } = req.body;

  if (!Array.isArray(lots) || lots.length === 0) {
    return res.status(400).json({ error: "Nessun lotto da aggiornare." });
  }

  try {
    await connection.beginTransaction();

    console.log("LOTS ARRIVATI:", lots);

    for (const lot of lots) {
      const { id, volumeUsed } = lot;

      const [rows] = await connection.query(
        "SELECT volume, partial_volume, status FROM dryer WHERE id = ?",
        [id],
      );

      if (rows.length === 0) continue;

      const { volume, partial_volume, status } = rows[0];

      if (status === "active") {
        const remaining = volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE dryer SET status = ?, partial_volume = ? WHERE id = ?",
            ["split", remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE dryer SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }
      } else if (status === "split") {
        const remaining = partial_volume - volumeUsed;

        if (remaining > 0) {
          await connection.query(
            "UPDATE dryer SET partial_volume = ? WHERE id = ?",
            [remaining, id],
          );
        } else {
          await connection.query(
            "UPDATE dryer SET status = ?, partial_volume = NULL WHERE id = ?",
            ["finished", id],
          );
        }

        console.log("INSERISCO:", lot);
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Lotti aggiornati" });
  } catch (err) {
    await connection.rollback();
    console.error("Errore PATCH /api/rest/update-lots:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

//BENEFICIO
//Endpoint per ottenere i dati di tutte le tulhas
app.get("/api/restforcleaning", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id AS rest_id,
        r.tulha,
        r.dateIn,
        r.volume AS rest_volume,
        r.rest_nLot,
        p.date AS patio_date,
        p.type AS patio_type,
        p.volume AS patio_volume,
        d.date AS dryer_date,
        d.volume AS dryer_volume,
        GROUP_CONCAT(DISTINCT p2.type SEPARATOR ', ') AS dryer_type
      FROM rest r
      JOIN rest_prevnlot rp ON r.id = rp.rest_id
      LEFT JOIN patio p ON rp.prev_nLot_patio = p.patio_nLot
      LEFT JOIN dryer d ON rp.prev_nLot_dryer = d.dryer_nLot
      LEFT JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
      LEFT JOIN patio p2 ON dp.prev_nLot_patio = p2.patio_nlot
      WHERE r.status IN ('active', 'split')
      GROUP BY r.id, r.tulha, r.dateIn, r.volume, r.rest_nLot,
               p.date, p.type, p.volume,
               d.date, d.volume
      ORDER BY r.tulha, r.dateIn ASC;
    `;

    const [rows] = await connection.query(query);

    const grouped = {};
    const seenRestIds = {}; // traccia i rest_id già contati per il volume

    rows.forEach((row) => {
      if (!grouped[row.tulha]) {
        grouped[row.tulha] = {
          tulha: row.tulha,
          totalVolume: 0,
          lots: [],
        };
      }

      // Somma il volume solo la prima volta che vedo questo rest_id
      if (!seenRestIds[row.rest_id]) {
        grouped[row.tulha].totalVolume += row.rest_volume;
        seenRestIds[row.rest_id] = true;
      }

      // Evita di pushare lotti duplicati (stesso rest_id già presente)
      const alreadyAdded = grouped[row.tulha].lots.find(
        (l) => l.rest_id === row.rest_id,
      );

      if (!alreadyAdded) {
        grouped[row.tulha].lots.push({
          rest_id: row.rest_id,
          rest_nLot: row.rest_nLot,
          dateIn: row.dateIn,
          volume: row.rest_volume,
          date: row.patio_date || row.dryer_date,
          type: row.patio_type || row.dryer_type,
          origin: row.patio_date ? "patio" : "dryer",
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("Errore /api/restforcleaning:", err);
    res.status(500).send("Errore recupero restforcleaning");
  }
});

// GET deposits
app.get("/api/deposits", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM deposits");
    res.status(200).json(results);
  } catch (err) {
    res.status(500).send("Errore recupero deposits");
  }
});

// POST deposit
app.post("/api/deposits", async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await connection.query(
      "INSERT INTO deposits (name) VALUES (?)",
      [name],
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).send("Errore inserimento deposit");
  }
});

// GET ultimo cleaning_nLot cleaning
app.get("/api/cleaning/last-nlot", async (req, res) => {
  try {
    const [rows] = await connection.query(
      "SELECT cleaning_nLot FROM cleaning ORDER BY cleaning_nLot DESC LIMIT 1",
    );
    res.json({
      cleaning_nLot: rows.length > 0 ? rows[0].cleaning_nLot : "C00000",
    });
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// POST cleaning
app.post("/api/cleaning", async (req, res) => {
  const {
    date,
    volume,
    weight,
    bags,
    umidity,
    cata,
    deposit,
    cleaning_nLot,
    lots,
  } = req.body;

  try {
    await connection.beginTransaction();

    // 1. Inserisci in cleaning
    const [ins] = await connection.query(
      `INSERT INTO cleaning (date, volume, weight, bags, cleaning_nLot, umidity, cata, deposit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        volume,
        weight,
        bags,
        cleaning_nLot,
        umidity || null,
        cata || null,
        deposit || null,
      ],
    );
    const cleaningId = ins.insertId;

    // 2. Per ogni tulha, applica FIFO e registra in cleaning_prevnlot
    for (const lot of lots) {
      let remaining = lot.volumeUsed;

      // Recupera i lotti della tulha ordinati FIFO (più vecchio prima)
      const [tulhaLots] = await connection.query(
        `SELECT id, rest_nLot, dateIn, timeIn, volume, partial_volume, status
         FROM rest
         WHERE id IN (?) AND tulha = ?
         ORDER BY dateIn ASC, timeIn ASC`,
        [lot.rest_ids, lot.tulha],
      );

      for (const row of tulhaLots) {
        if (remaining <= 0) break;

        const currentVolume =
          row.status === "split" && row.partial_volume != null
            ? row.partial_volume
            : row.volume;

        const consumed = Math.min(remaining, currentVolume);

        // Registra in cleaning_prevnlot
        await connection.query(
          `INSERT INTO cleaning_prevnlot (cleaning_id, prev_nLot_rest, volume)
           VALUES (?, ?, ?)`,
          [cleaningId, row.rest_nLot, consumed],
        );

        // Aggiorna status del lotto rest
        if (consumed >= currentVolume) {
          await connection.query(
            "UPDATE rest SET status = 'finished', partial_volume = NULL WHERE id = ?",
            [row.id],
          );
        } else {
          await connection.query(
            "UPDATE rest SET status = 'split', partial_volume = ? WHERE id = ?",
            [currentVolume - consumed, row.id],
          );
        }

        remaining -= consumed;
      }
    }

    await connection.commit();
    res.status(201).json({
      message: "Cleaning registrato",
      cleaningId,
      cleaning_nLot,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Errore POST /api/cleaning:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// PATCH cleaning — aggiorna dati stocking
app.patch("/api/cleaning/:id", async (req, res) => {
  const { id } = req.params;
  const {
    weight,
    bags,
    umidity,
    cata,
    peneira,
    weight_deposit,
    umidity_deposit,
    cata_deposit,
    peneira_deposit,
    bebida,
    deposit,
  } = req.body;
  try {
    await connection.query(
      `UPDATE cleaning 
   SET weight = ?, bags = ?, umidity = ?, cata = ?, peneira = ?,
       weight_deposit = ?, umidity_deposit = ?, cata_deposit = ?,
       peneira_deposit = ?, bebida = ?, deposit = ?
   WHERE id = ?`,
      [
        weight || null,
        bags || null,
        umidity || null,
        cata || null,
        peneira || null,
        weight_deposit || null,
        umidity_deposit || null,
        cata_deposit || null,
        peneira_deposit || null,
        bebida || null,
        deposit || null,
        id,
      ],
    );
    res.status(200).json({ message: "Lotto aggiornato con successo" });
  } catch (err) {
    console.error("Errore PATCH /api/cleaning/:id", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// GET cleaning — tutti i lotti puliti
app.get("/api/cleaning", async (req, res) => {
  try {
    const [results] = await connection.query(
      "SELECT * FROM cleaning ORDER BY date DESC",
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Errore GET /api/cleaning", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

//Selling
// GET buyers
app.get("/api/buyers", async (req, res) => {
  try {
    const [results] = await connection.query(
      "SELECT * FROM buyers ORDER BY name",
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// POST buyer
app.post("/api/buyers", async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await connection.query(
      "INSERT INTO buyers (name) VALUES (?)",
      [name],
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

app.get("/api/selling", async (req, res) => {
  try {
    const [results] = await connection.query(
      `SELECT * FROM cleaning 
       WHERE status != 'sold'
       ORDER BY date DESC`,
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// GET selling/history — storico vendite
app.get("/api/selling/history", async (req, res) => {
  try {
    const [results] = await connection.query(
      `SELECT s.*, b.name AS buyer_name, c.cleaning_nLot
       FROM selling s
       JOIN buyers b ON s.buyer_id = b.id
       JOIN cleaning c ON s.cleaning_id = c.id
       ORDER BY s.date DESC`,
    );
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// POST selling — registra vendita
app.post("/api/selling", async (req, res) => {
  const {
    lots,
    buyer_id,
    price_per_bag,
    currency,
    notes,
    date,
    certification,
    certification_bonus,
  } = req.body;
  // lots = array di { cleaning_nLot, cleaning_id, bags_sold, weight_sold }

  try {
    await connection.beginTransaction();

    // Genera selling_nLot
    const [last] = await connection.query(
      "SELECT selling_nLot FROM selling ORDER BY selling_nLot DESC LIMIT 1",
    );
    const lastNlot = last.length === 0 ? "S00000" : last[0].selling_nLot;
    const nextNum = parseInt(lastNlot.substring(1)) + 1;
    const newNlot = "S" + nextNum.toString().padStart(5, "0");

    // Totali aggregati
    const totalBags = lots.reduce((sum, l) => sum + l.bags_sold, 0);
    const totalWeight = lots.reduce((sum, l) => sum + (l.weight_sold || 0), 0);

    // Inserisci vendita
    const [ins] = await connection.query(
      `INSERT INTO selling (date, buyer_id, bags_sold, weight_sold, price_per_bag, currency, notes, selling_nLot, certification, certification_bonus)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        buyer_id,
        totalBags,
        totalWeight || null,
        price_per_bag || null,
        currency || "USD",
        notes || null,
        newNlot,
        certification || null,
        certification_bonus || null,
      ],
    );
    const sellingId = ins.insertId;

    // Per ogni lotto venduto
    for (const lot of lots) {
      // Inserisci in selling_prevnlot
      await connection.query(
        `INSERT INTO selling_prevnlot (selling_id, prev_nLot_cleaning, bags)
         VALUES (?, ?, ?)`,
        [sellingId, lot.cleaning_nLot, lot.bags_sold],
      );

      // Aggiorna status cleaning
      const [rows] = await connection.query(
        "SELECT bags, weight, partial_bags, partial_weight, status FROM cleaning WHERE id = ?",
        [lot.cleaning_id],
      );
      if (rows.length === 0) continue;

      const c = rows[0];
      const currentBags =
        c.status === "partial" && c.partial_bags != null
          ? c.partial_bags
          : c.bags;
      const currentWeight =
        c.status === "partial" && c.partial_weight != null
          ? c.partial_weight
          : c.weight;
      const remainingBags = currentBags - lot.bags_sold;
      const remainingWeight =
        currentWeight && lot.weight_sold
          ? currentWeight - lot.weight_sold
          : null;

      if (remainingBags > 0) {
        await connection.query(
          "UPDATE cleaning SET status = 'partial', partial_bags = ?, partial_weight = ? WHERE id = ?",
          [remainingBags, remainingWeight, lot.cleaning_id],
        );
      } else {
        await connection.query(
          "UPDATE cleaning SET status = 'sold', partial_bags = NULL, partial_weight = NULL WHERE id = ?",
          [lot.cleaning_id],
        );
      }
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Vendita registrata", selling_nLot: newNlot });
  } catch (err) {
    await connection.rollback();
    console.error("Errore POST /api/selling:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// GET aggiustamenti per un lotto
app.get("/api/stock-adjustments/:cleaning_id", async (req, res) => {
  try {
    const [rows] = await connection.query(
      "SELECT * FROM stock_adjustments WHERE cleaning_id = ? ORDER BY date DESC",
      [req.params.cleaning_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

// POST aggiustamento — registra perdita
app.post("/api/stock-adjustments", async (req, res) => {
  const { cleaning_id, bags_lost, date, notes } = req.body;
  try {
    await connection.beginTransaction();

    // Inserisci aggiustamento
    await connection.query(
      "INSERT INTO stock_adjustments (date, cleaning_id, bags_lost, notes) VALUES (?, ?, ?, ?)",
      [date, cleaning_id, bags_lost, notes || null],
    );

    // Aggiorna il residuo in cleaning
    const [rows] = await connection.query(
      "SELECT bags, partial_bags, status FROM cleaning WHERE id = ?",
      [cleaning_id],
    );
    const lot = rows[0];
    const current =
      lot.status === "partial" && lot.partial_bags != null
        ? lot.partial_bags
        : lot.bags;
    const remaining = current - bags_lost;

    if (remaining > 0) {
      await connection.query(
        "UPDATE cleaning SET partial_bags = ?, status = 'partial' WHERE id = ?",
        [remaining, cleaning_id],
      );
    } else {
      await connection.query(
        "UPDATE cleaning SET partial_bags = NULL, status = 'sold' WHERE id = ?",
        [cleaning_id],
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Aggiustamento registrato" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Errore interno" });
  }
});

// ALBERO GENALOGICO LOTTI
// GET /api/lot-history/:nLot — ricostruisce l'albero completo a partire da qualsiasi lotto
app.get("/api/lot-history/:nLot", async (req, res) => {
  const { nLot } = req.params;

  try {
    // Funzione ricorsiva che costruisce il nodo e i suoi figli
    const buildTree = async (nLot) => {
      const prefix = nLot.charAt(0).toUpperCase();
      let node = { nLot, type: getType(prefix), data: null, children: [] };

      // Carica i dati del nodo corrente
      node.data = await fetchNodeData(prefix, nLot);

      // Trova i figli in base al tipo
      const children = await fetchChildren(prefix, nLot);
      for (const childNLot of children) {
        node.children.push(await buildTree(childNLot));
      }

      return node;
    };

    const getType = (prefix) =>
      ({
        H: "Raccolta",
        P: "Patio",
        D: "Dryer",
        F: "Fermentazione",
        R: "Resting",
        C: "Cleaning",
        S: "Selling",
      })[prefix] || "Sconosciuto";

    const fetchNodeData = async (prefix, nLot) => {
      const queries = {
        H: "SELECT newlot_nLot AS nLot, date, plot, volume, method, type FROM newlot WHERE newlot_nLot = ?",
        P: "SELECT patio_nLot AS nLot, date, name, volume, type, status FROM patio WHERE patio_nLot = ?",
        D: "SELECT dryer_nLot AS nLot, date, dryer AS name, volume, status FROM dryer WHERE dryer_nLot = ?",
        F: "SELECT fermentation_nLot AS nLot, date, volume, method, type FROM fermentation WHERE fermentation_nLot = ?",
        R: "SELECT rest_nLot AS nLot, dateIn AS date, tulha AS name, volume, status FROM rest WHERE rest_nLot = ?",
        C: "SELECT cleaning_nLot AS nLot, date, volume, weight, bags, deposit FROM cleaning WHERE cleaning_nLot = ?",
        S: `SELECT selling_nLot AS nLot, date, bags_sold AS bags, price_per_bag, currency 
    FROM selling WHERE selling_nLot = ?`,
      };
      if (!queries[prefix]) return null;
      const [rows] = await connection.query(queries[prefix], [nLot]);
      return rows[0] || null;
    };

    const fetchChildren = async (prefix, nLot) => {
      let children = [];

      if (prefix === "H") {
        const [rows] = await connection.query(
          `SELECT p.patio_nLot FROM patio p
           JOIN patio_prevnlot pp ON p.id = pp.patio_id
           WHERE pp.prev_nLot_newlot = ?`,
          [nLot],
        );
        children = rows.map((r) => r.patio_nLot);
      } else if (prefix === "P") {
        // Figli dryer
        const [dRows] = await connection.query(
          `SELECT d.dryer_nLot FROM dryer d
           JOIN dryer_prevnlot dp ON d.id = dp.dryer_id
           WHERE dp.prev_nLot_patio = ?`,
          [nLot],
        );
        // Figli fermentation
        const [fRows] = await connection.query(
          `SELECT f.fermentation_nLot FROM fermentation f
           JOIN fermentation_prevnlot fp ON f.id = fp.fermentation_id
           WHERE fp.prev_nLot_patio = ?`,
          [nLot],
        );
        // Figli rest (diretti da patio)
        const [rRows] = await connection.query(
          `SELECT r.rest_nLot FROM rest r
           JOIN rest_prevnlot rp ON r.id = rp.rest_id
           WHERE rp.prev_nLot_patio = ?`,
          [nLot],
        );
        children = [
          ...dRows.map((r) => r.dryer_nLot),
          ...fRows.map((r) => r.fermentation_nLot),
          ...rRows.map((r) => r.rest_nLot),
        ];
      } else if (prefix === "D") {
        const [rows] = await connection.query(
          `SELECT r.rest_nLot FROM rest r
           JOIN rest_prevnlot rp ON r.id = rp.rest_id
           WHERE rp.prev_nLot_dryer = ?`,
          [nLot],
        );
        children = rows.map((r) => r.rest_nLot);
      } else if (prefix === "F") {
        // La fermentazione genera un nuovo patio
        const [rows] = await connection.query(
          `SELECT p.patio_nLot FROM patio p
           JOIN patio_prevnlot pp ON p.id = pp.patio_id
           WHERE pp.prev_nLot_fermentation = ?`,
          [nLot],
        );
        children = rows.map((r) => r.patio_nLot);
      } else if (prefix === "R") {
        const [rows] = await connection.query(
          `SELECT c.cleaning_nLot FROM cleaning c
           JOIN cleaning_prevnlot cp ON c.id = cp.cleaning_id
           WHERE cp.prev_nLot_rest = ?`,
          [nLot],
        );
        children = rows.map((r) => r.cleaning_nLot);
      } else if (prefix === "C") {
        const [rows] = await connection.query(
          `SELECT s.selling_nLot FROM selling s
     JOIN selling_prevnlot sp ON s.id = sp.selling_id
     WHERE sp.prev_nLot_cleaning = ?`,
          [nLot],
        );
        children = rows.map((r) => r.selling_nLot);
      }

      // C (cleaning) è foglia — nessun figlio per ora (selling verrà aggiunto)

      return [...new Set(children)]; // deduplicazione
    };

    const tree = await buildTree(nLot);
    res.json(tree);
  } catch (err) {
    console.error("Errore /api/lot-history:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});



//DASHBOARD
// Dashboard stats per appezzamento
app.get("/api/dashboard/plot/:codename", async (req, res) => {
  const { codename } = req.params;
  try {
    // 1. Info base appezzamento
    const [plotInfo] = await connection.query(
      "SELECT * FROM plots WHERE codename = ?", [codename]
    );
    if (plotInfo.length === 0) return res.status(404).json({ error: "Appezzamento non trovato" });
    const plot = plotInfo[0];

    // 2. Totale litri raccolti (newlot)
    const [harvest] = await connection.query(
      `SELECT COUNT(*) as nLots, COALESCE(SUM(volume), 0) as totalVolume
       FROM newlot WHERE plot = ?`, [codename]
    );

    // 3. Distribuzione tipi sul patio (CD, Green, Dry, Natural, BigDry)
    const [typesDist] = await connection.query(
      `SELECT p.type, COALESCE(SUM(p.volume), 0) as volume
       FROM patio p
       JOIN patio_prevnlot pp ON p.id = pp.patio_id
       JOIN newlot nl ON pp.prev_nLot_newlot = nl.newlot_nLot
       WHERE nl.plot = ?
       GROUP BY p.type`, [codename]
    );

    // 4. Renda — litri raccolti / peso pulito venduto
    const [renda] = await connection.query(
      `SELECT 
         COALESCE(SUM(nl.volume), 0) as litersHarvested,
         COALESCE(SUM(c.weight_deposit), 0) as weightSold
       FROM newlot nl
       LEFT JOIN patio_prevnlot pp ON pp.prev_nLot_newlot = nl.newlot_nLot
       LEFT JOIN patio p ON p.id = pp.patio_id
       LEFT JOIN rest_prevnlot rp ON rp.prev_nLot_patio = p.patio_nLot
       LEFT JOIN rest r ON r.id = rp.rest_id
       LEFT JOIN cleaning_prevnlot cp ON cp.prev_nLot_rest = r.rest_nLot
       LEFT JOIN cleaning c ON c.id = cp.cleaning_id
       WHERE nl.plot = ?`, [codename]
    );

    // 5. Andamento raccolta nel tempo (per grafico a linea)
    const [harvestOverTime] = await connection.query(
      `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(volume) as volume
       FROM newlot WHERE plot = ?
       GROUP BY month ORDER BY month ASC`, [codename]
    );

    res.json({
      plot,
      harvest: harvest[0],
      typesDist,
      renda: renda[0],
      harvestOverTime,
    });
  } catch (err) {
    console.error("Errore /api/dashboard/plot:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

app.use(express.static(path.join(__dirname, "..", "client", "build")));

// Gestire tutte le altre richieste restituendo il file index.html di React
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
