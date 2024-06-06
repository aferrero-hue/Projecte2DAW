const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const cors = require("cors"); // Importa el paquet cors
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


const uri = "mongodb+srv://aferrero:13PWFW5OpgDQ56fu@cluster0.nxj9ol6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Conectar a la base de dades
const client = new MongoClient(uri,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
//app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true
}));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//GET: Obtenir Dades.
//------------------------
//Agafar totes les dades dels usuaris: [PENDENT] CAMBIAR NOM PER USER
app.get("/GET/User", async (req, res) => {
    try {
        const data = await GetDates(); // Espera a que se resuelva la promesa
        console.log("Proceso completado");
        res.json(data); // Enviar una respuesta JSON con los datos obtenidos
    } catch (error) {
        // Manejar cualquier error que ocurra durante la conexión o la consulta
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
async function GetDates(){
    await client.connect();
    console.log("Conectado a MongoDB");
    
    // Seleccionar la base de datos y la colección
    const database = client.db("Estetica");
    const collection = database.collection("Usuaris");
    
    // Obtener todos los documentos de la colección
    const datos = await collection.find({}).toArray();
    //console.log("Datos:", datos);
    
    // Mapear los datos para obtener solo el nombre y la próxima fecha
    const datesWithName = datos.map(doc => ({ name: doc.name, nextdate: doc.nextdate }));
    
    return datesWithName;
}
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//POST: Enmagetzamar dades en la BDD
app.post("/POST/User", async (req, res) => {
    try {
        const nombre = req.body.nombre;
        const contrasenya = req.body.contrasenya;
        const email = req.body.email;


        const data = await POSTuser(nombre, email, contrasenya); // Espera a que se resuelva la promesa
        console.log("Proceso completado");
        res.json(data); // Enviar una respuesta JSON con los datos obtenidos
    } catch (error) {
        // Manejar cualquier error que ocurra durante la conexión o la consulta
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
async function POSTuser(Nom, Email, Contrasenya) {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();

        // Seleccionar la base de datos y la colección
        const database = client.db("Estetica");
        const collection = database.collection("Usuaris");
        const nextDate = null;

        //Encriptar contrasenya
        Contrasenya = encriptarConSHA256(Contrasenya);

        //Verificar si l'usuari existeix en la BDD o el correu [PENDENT]
        const existingUser = await collection.findOne({ name: Nom });
        const existingEmail = await collection.findOne({ name: Email });

        if (existingUser) {
            if(existingEmail){
                console.log("EMAIL NO DISPONIBLE");
                return "Email no disponible";

            }else{
                console.log("USUARI NO DISPONIBLE");
                return "Usuari no disponible";
            }
        }else{
            // Crear un nuevo documento para insertar en la colección
            const nuevoUsuario = {
                name: Nom,
                email: Email,
                passwd: Contrasenya,
                nextdate: nextDate
            };
            // Insertar el nuevo documento en la colección
            const resultado = await collection.insertOne(nuevoUsuario);
            console.log("Nuevo usuario insertado:", resultado.insertedId);
        }
        return Nom;

    } catch (error) { 
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }  finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//PUT: Modificar Dades:
app.put("/PUT/User", async (req, res) => {
    try {
        const usuari = req.body.usuari;
        const nextdate = req.body.nextdate;

        UpdateUser(usuari, nextdate);
        res.json(200);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
async function UpdateUser(usuari, data){
    await client.connect();
    console.log("Conectado a MongoDB");
    
    // Seleccionar la base de datos y la colección
    const database = client.db("Estetica");
    const collection = database.collection("Usuaris");

    console.log(data);
    const filter = { name: usuari };
    const updateDoc = {
        $set: { nextdate : data } 
    };
    const result = await collection.updateOne(filter, updateDoc);
    console.log(updateDoc);
}
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//DEL: Eliminar Dades:
app.put("/POST/User/Date", async (req, res) => {
    try {
        const usuari = req.body.usuari;

        UpdateUserDate(usuari);
        res.json(200);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
async function UpdateUserDate(userName){
    try {
        await client.connect();
        console.log("Conectado a MongoDB");
    
        const database = client.db("Estetica");
        const collection = database.collection("Usuaris");
    
        const updateResult = await collection.updateOne(
          { name: userName }, 
          { $set: { nextdate: null } }
        );
    
        if (updateResult.matchedCount === 0) {
          console.log(`No existeix el usuari: ${userName}`);
        } else {
          console.log(`S'ha actualitzat el usuari: ${userName}`);
        }
    
    } catch (error) {
        console.error('Error al conectar o actualizar la base de datos:', error);
    }
}
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//Altres: AccesToken/Cookies/Encriptació
//--------------------------------------------
//Funció per encriptar la contraseña a sha256:
function encriptarConSHA256(contraseña) {
    const hash = crypto.createHash('sha256');
    hash.update(contraseña);
    return hash.digest('hex');
  }
//--------------------------------------------------------------------
//--------------------------------------------------------------------
//AUTH [PENDENT]
async function login(Nom, Contrasenya) {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();

        // Seleccionar la base de datos y la colección
        const database = client.db("Estetica");
        const collection = database.collection("Usuaris");

        Contrasenya = encriptarConSHA256(Contrasenya);

        //Verificar si l'usuari existeix en la BDD o el correu [PENDENT]
        const existingUser = await collection.findOne({ name: Nom });
        if(existingUser){
            if (existingUser.passwd === Contrasenya) {
                // La contraseña es correcta, el usuario puede iniciar sesión
                console.log("¡Contraseña correcta! Usuario autenticado.");
                const token = jwt.sign({ userId: existingUser.name }, 'secret_key', { expiresIn: '1h' });

                //return existingUser.name;
                return token;

            } else {
                // La contraseña es incorrecta
                console.log("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
                return "Contraseña incorrecta";
            }
        }else {
            // El usuario no existe en la base de datos
            console.log("El usuario no existe.");
            return "El usuario no existe";
        }


    } catch (error) { 
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }  finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
//---------------------------------------------------------------
//---------------------------------------------------------------
//Autentificació usuari login:
app.post("/login/:nombre", async (req, res) => {
    try {
        /*const nombre = req.params.nombre; // Obtener el valor del parámetro nombre de la URL
        const contrasenya = req.params.contrasenya;*/
        const nombre = req.params.nombre;
        const contrasenya = req.body.password;
        //const contrasenya = "ahmed1234";
        const data = await login(nombre, contrasenya); // Espera a que se resuelva la promesa
        if(data == "Contraseña incorrecta" || data == "El usuario no existe"){
            res.json(data);
        }else{
            //const token = jwt.sign({ userId: data }, 'secret_key', { expiresIn: '1h' });
            //res.cookie("jwt", token);
            res.json(data); // Enviar una respuesta JSON con los datos obtenidos
        }
    
    } catch (error) {
        // Manejar cualquier error que ocurra durante la conexión o la consulta
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
app.listen(8000, () => {
    console.log("Server started on port 8000");
});
//--------------------------
module.exports = { login };
//--------------------------