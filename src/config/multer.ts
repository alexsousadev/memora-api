import multer from "multer";
import path from "path";

// Configuração para salvar em disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Pasta onde os arquivos serão salvos
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Nome do arquivo: timestamp + nome original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para aceitar apenas arquivos de áudio
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'audio/mpeg',      // MP3
        'audio/mp3',       // MP3 (algumas implementações)
        'audio/wav',       // WAV
        'audio/wave',      // WAV (alternativo)
        'audio/x-wav',     // WAV (alternativo)
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de áudio MP3 ou WAV são permitidos'));
    }
};

// Configuração do multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});
