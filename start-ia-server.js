const path = require('path');
const child_process = require('child_process');
const fs = require('fs');

// Función para iniciar el servidor Flask
function resolvePythonExecutable(iaPath) {
  const fs = require('fs');
  const path = require('path');
  const candidates = [];
  const isWin = process.platform === 'win32';

  const venvWin = path.join(iaPath, 'venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(iaPath, 'venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) candidates.push(venvWin);
  if (fs.existsSync(venvUnix)) candidates.push(venvUnix);

  if (process.env.PYTHON_PATH) candidates.push(process.env.PYTHON_PATH);

  if (isWin) {
    candidates.push('py');
    candidates.push('python');
    candidates.push('python3');
    // Buscar instaladores comunes de Python en Windows
    const la = process.env.LOCALAPPDATA;
    if (la) {
      const base = path.join(la, 'Programs', 'Python');
      if (fs.existsSync(base)) {
        try {
          const dirs = fs.readdirSync(base).filter(d => d.toLowerCase().startsWith('python3'));
          // ordenar por versión descendente
          dirs.sort((a, b) => b.localeCompare(a));
          for (const d of dirs) {
            const exe = path.join(base, d, 'python.exe');
            if (fs.existsSync(exe)) candidates.push(exe);
          }
        } catch {}
      }
    }
    const pf = process.env.ProgramFiles;
    if (pf) {
      ['Python311','Python312','Python313','Python310','Python39'].forEach(dir => {
        const exe = path.join(pf, dir, 'python.exe');
        if (fs.existsSync(exe)) candidates.push(exe);
      });
    }
  } else {
    candidates.push('python3');
    candidates.push('/usr/bin/python3');
    candidates.push('/usr/local/bin/python3');
  }

  // Devolver el primer candidato válido
  return candidates[0] || (isWin ? 'py' : 'python3');
}

function verifyPython(py) {
  const { spawnSync } = require('child_process');
  try {
    const r = spawnSync(py, ['--version'], { stdio: 'ignore', shell: false });
    return r.status === 0;
  } catch {
    return false;
  }
}

function startFlaskServer() {
  console.log('Iniciando servidor de IA...');
  
  // Ruta al directorio donde se encuentra app.py
  const iaPath = path.join(__dirname, 'views', 'IA');
  
  let pythonExecutable = resolvePythonExecutable(iaPath);

  // Verificar si el ejecutable de Python del entorno virtual existe
  const usingLauncher = pythonExecutable === 'py' || pythonExecutable === 'python' || pythonExecutable === 'python3';
  const existsPath = !usingLauncher ? fs.existsSync(pythonExecutable) : true;
  if (!existsPath || !verifyPython(pythonExecutable)) {
    console.error(`Error: No se encontró el ejecutable de Python en el entorno virtual: ${pythonExecutable}`);
    console.error('Asegúrese de que el entorno virtual esté configurado correctamente y que Python 3.12 esté instalado.');
    console.log('Intentando crear el entorno virtual e instalar dependencias...');
    // Intentar crear el entorno virtual e instalar dependencias
    const installDependencies = require('./install-ia-dependencies');
    installDependencies(); // Llama a la función para crear venv e instalar
    // Después de intentar la instalación, verificar de nuevo
    pythonExecutable = resolvePythonExecutable(iaPath);
    if ((pythonExecutable === 'py' || pythonExecutable === 'python' || pythonExecutable === 'python3') ? !verifyPython(pythonExecutable) : !fs.existsSync(pythonExecutable)) {
      console.error('Falló la creación del entorno virtual o la instalación de dependencias. No se puede iniciar el servidor de IA.');
      return null;
    }
  }
  
  console.log(`Intentando iniciar el servidor de IA con: ${pythonExecutable}`);
  const flaskProcess = child_process.spawn(pythonExecutable, ['app.py'], {
    cwd: iaPath,
    stdio: 'pipe',
    env: { ...process.env, PATH: `${path.join(iaPath, 'venv', 'Scripts')}:${path.join(iaPath, 'venv', 'bin')};${process.env.PATH}` }
  });

  // Manejar salida estándar
  flaskProcess.stdout.on('data', (data) => {
    console.log(`[IA Server]: ${data}`);
  });

  // Manejar errores
  flaskProcess.stderr.on('data', (data) => {
    console.error(`[IA Server Error]: ${data}`);
  });

  // Manejar cierre
  flaskProcess.on('close', (code) => {
    console.log(`[IA Server] proceso terminado con código ${code}`);
    // Reiniciar el servidor si se cierra inesperadamente, pero no si es por falta de Python
    if (code !== 0 && code !== 103 && code !== 1) {
      console.log('Reiniciando servidor de IA en 5 segundos...');
      setTimeout(startFlaskServer, 5000);
    } else {
      console.log('No se pudo iniciar el servidor de IA correctamente.');
      console.log('La funcionalidad de IA no estará disponible, pero el servidor principal funcionará normalmente.');
      console.log('Verifique que Python esté instalado y que las dependencias estén correctamente configuradas.');
    }
  });
  
  // Establecer un timeout para detectar si el servidor no inicia correctamente
  const timeout = setTimeout(() => {
    if (flaskProcess.exitCode === null) {
      console.log('El servidor de IA parece estar funcionando correctamente.');
    }
  }, 5000);

  return flaskProcess;
}

// Exportar la función para usarla en server.js
module.exports = startFlaskServer;