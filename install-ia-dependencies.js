const path = require('path');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

// Función para instalar dependencias de Python
function installPythonDependencies() {
  console.log('Verificando e instalando dependencias de Python para el servidor de IA...');
  
  // Ruta al directorio donde se encuentra app.py
  const iaPath = path.join(__dirname, 'views', 'IA');
  
  // Crear archivo requirements.txt si no existe
  const requirementsPath = path.join(iaPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    fs.writeFileSync(requirementsPath, 'flask\nflask-cors\ngoogle-generativeai');
    console.log('Archivo requirements.txt creado.');
  }
  
  // Ruta al entorno virtual
  const venvPath = path.join(iaPath, 'venv');
  const pythonExecutableWin = path.join(venvPath, 'Scripts', 'python.exe');
  const pipExecutableWin = path.join(venvPath, 'Scripts', 'pip.exe');
  const pythonExecutableUnix = path.join(venvPath, 'bin', 'python');
  const pipExecutableUnix = path.join(venvPath, 'bin', 'pip');

  // 1. Crear entorno virtual si no existe
  const venvExists = fs.existsSync(venvPath);
  if (venvExists) {
    const pyInVenv = fs.existsSync(pythonExecutableWin) ? pythonExecutableWin : (fs.existsSync(pythonExecutableUnix) ? pythonExecutableUnix : null);
    if (!pyInVenv) {
      try {
        fs.rmSync(venvPath, { recursive: true, force: true });
        console.log('Entorno virtual inválido eliminado.');
      } catch (e) {
        console.warn('No se pudo eliminar venv inválido:', e.message);
      }
    }
  }
  if (!fs.existsSync(venvPath)) {
    console.log('Creando entorno virtual...');
    let venvProcess = spawnSync(process.platform === 'win32' ? 'py' : 'python3', ['-m', 'venv', venvPath], { cwd: iaPath, stdio: 'inherit', shell: true });
    if (venvProcess.status !== 0) {
      venvProcess = spawnSync('python', ['-m', 'venv', venvPath], { cwd: iaPath, stdio: 'inherit', shell: true });
    }
    if (venvProcess.status !== 0) {
      console.error('Error al crear el entorno virtual.');
      return;
    }
    console.log('Entorno virtual creado.');
  }

  // 2. Instalar dependencias usando pip del entorno virtual
  console.log('Instalando dependencias en el entorno virtual...');
  const pipExecutable = fs.existsSync(pipExecutableWin) ? pipExecutableWin : pipExecutableUnix;
  const installProcess = spawn(pipExecutable, ['install', '-r', 'requirements.txt'], {
    cwd: iaPath,
    stdio: 'pipe',
    shell: true
  });

  // Manejar salida estándar
  installProcess.stdout.on('data', (data) => {
    console.log(`[Python Install]: ${data}`);
  });

  // Manejar errores
  installProcess.stderr.on('data', (data) => {
    console.error(`[Python Install Error]: ${data}`);
  });

  // Manejar cierre
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Dependencias de Python instaladas correctamente.');
    } else {
      console.error(`Error al instalar dependencias de Python. Código: ${code}`);
      console.log('Por favor, instala manualmente las siguientes dependencias:');
      console.log('pip install flask flask-cors google-generativeai');
    }
  });
}

module.exports = installPythonDependencies;