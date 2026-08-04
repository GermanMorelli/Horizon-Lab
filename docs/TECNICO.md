# Simulador de agujeros negros Kerr-Newman

Simulación de un agujero negro por **trazado de geodésicas nulas en GPU**, con masa,
carga eléctrica y momento angular ajustables y cámara orbital.

No es una visualización estilizada. Cada píxel se obtiene integrando numéricamente
la trayectoria de un fotón en la métrica de Kerr-Newman: la sombra, el anillo de
fotones, los anillos de Einstein, el beaming Doppler y el corrimiento gravitacional
**emergen del cálculo**. Lo que respalda esa afirmación está en
[§ Validación](#validación): el trazador reproduce el radio de sombra de
Schwarzschild `√27 M` con un error del **0.03 %** medido sobre los píxeles de la
imagen, y el de Reissner-Nordström extremal `4 M` con un **0.07 %**.

```bash
npm install
npm run dev        # http://localhost:5173
```

---

## Los tres parámetros

Actúan de formas cualitativamente distintas, y entenderlo es la clave para usar la app.

### Momento angular `a = J/M²`

Deforma la geometría. La sombra pierde la simetría circular y desarrolla su borde
plano característico del lado prógrado; aparece la ergosfera, que se achata con el
espín; el ISCO se acerca al horizonte (de `6 M` a `M` en el límite extremal) y la
eficiencia de acreción sube del 5.7 % a más del 40 %. El arrastre de marcos desplaza
la sombra entera respecto al centro de la imagen: a `a/M = 0.9` visto de canto, un
**39 % de su propio radio**.

El rango se acota a `|a/M| ≤ 0.998`, el límite de Thorne para acreción astrofísica.

### Carga `q = Q/M`

Entra en la métrica a través de `Δ = r² − 2Mr + a² + Q²`. Contrae los horizontes
(`r± = M ± √(M² − a² − Q²)`) y con ellos la sombra: de `√27 M = 5.196 M` a `4 M`
en el caso extremal `q = 1`.

Dos advertencias que la app declara en pantalla:

- **No es astrofísico.** Los agujeros negros reales se descargan hasta `Q/M ~ 10⁻¹⁸`
  por el plasma circundante. La geometría es una solución exacta de
  Einstein-Maxwell; el escenario no es observable.
- Los fotones son **neutros**: la carga solo les afecta vía la métrica. El único
  lugar donde actúa electromagnéticamente es sobre las partículas de prueba
  cargadas del trazador de órbitas, mediante la fuerza de Lorentz del potencial
  `A_μ = −(Qr/Σ)(dt − a sin²θ dφ)`.

### Masa `M` — y por qué necesita dos modos de distancia

En unidades geometrizadas (`G = c = 1`) con `M` como unidad de longitud, **la forma
de la imagen depende solo de `a/M` y `Q/M`**. La masa es el factor de escala. Si el
slider solo reescalara longitudes, moverlo no cambiaría nada y parecería roto.

Así que la masa actúa por sus tres efectos físicos genuinos:

| Efecto | Relación | Qué se ve |
|---|---|---|
| Escala de longitud | `r_g = GM/c² = 1.4766 km × (M/M☉)` | Lecturas en km / AU / pc en el HUD |
| Tamaño angular | `θ ≈ √27 · r_g / D` a distancia física fija | El agujero crece o se encoge |
| Brillo del disco | `T_máx ∝ M^(−1/4)`, y la radiancia visible `∝ T` | Un disco más caliente brilla más |
| Tiempo orbital | `T_orb ∝ M` | ISCO de Sgr A* ~30 min, de M87* ~días, estelar ~ms |

De ahí los dos modos de distancia del panel de Cámara:

- **`en radios r_g`** (por defecto): la distancia se mide en `M`, así que la geometría
  no cambia al mover la masa. Es el modo para estudiar la forma.
- **`distancia física`**: la masa cambia el tamaño angular. Es el modo para entender
  por qué M87* y Sgr A* tienen tamaños aparentes parecidos desde la Tierra.

Sobre el color: por encima de unos `2×10⁴ K` la cromaticidad visible **se satura** en
blanco-azul, porque la banda visible queda en el régimen de Rayleigh-Jeans. El brillo
superficial sigue creciendo `∝ T`, pero el tono ya no. La app reporta `T_máx`, el pico
de Wien y la fracción visible en el HUD en lugar de exagerar un cambio de color que no
existe.

---

## Cómo se calcula la imagen

### Métrica y formulación

Coordenadas de Boyer-Lindquist, `G = c = M = 1`:

```
Δ = r² − 2r + a² + q²        Σ = r² + a² cos²θ
A = (r² + a²)² − a² Δ sin²θ
```

Se integra el flujo hamiltoniano con `H = ½ g^{μν} p_μ p_ν = 0`. Como la métrica no
depende de `t` ni de `φ`, `p_t = −E` y `p_φ = L` son constantes de movimiento y el
sistema se reduce a **cinco ODEs** por rayo:

```
2 Σ H = Δ p_r² + p_θ² + F
F = −U²/Δ + w²,   U = (r²+a²)E − aL,   w = aE sin θ − L/sin θ
```

Dos decisiones de diseño que importan:

- **Forma hamiltoniana de segundo orden**, no la forma separada de Carter con
  `±√R(r)`, `±√Θ(θ)`. Evita gestionar los cambios de signo en los puntos de retorno,
  que son la fuente clásica de artefactos en este tipo de trazador.
- **Derivadas analíticas** de la métrica en el shader (está en el camino crítico de la
  GPU); numéricas de 5 puntos en el trazador de órbitas de CPU, donde ahorran una
  página de álgebra propensa a errores y la conservación de `H` las valida.

Integrador Runge-Kutta-Fehlberg 4(5) con coeficientes de Cash-Karp y paso adaptativo,
limitado además por la proximidad al horizonte para que ningún paso lo cruce.

#### Dos trampas del control de paso adaptativo

Ambas se encontraron durante la validación y ambas están comentadas en el código, porque
son fáciles de reintroducir:

**El error relativo puro falla con componentes nulas.** En una trayectoria ecuatorial
`p_θ = 0` exactamente. Con un suelo minúsculo en la escala del error, su ruido de redondeo
(~10⁻¹⁶) se convierte en un error *relativo* enorme que domina la norma y limita el paso
de forma permanente. El síntoma observado: 300 000 pasos para avanzar un parámetro afín de
4900 —paso medio 0.016— mientras la deriva del hamiltoniano era de 10⁻¹⁵. Precisión de
sobra, rendimiento inutilizable. La norma usa por tanto un suelo absoluto
(`ERR_FLOOR = 10⁻³` en `geodesic.ts`): con él, la misma integración cuesta **1895 pasos**,
158× menos, y con *mejor* precisión.

**El paso de diferenciación numérica tiene un óptimo, y no es «lo más pequeño posible».**
Para un stencil centrado de 5 puntos el error total suma truncamiento `O(h⁴)` y redondeo
`O(ε/h)`, minimizados en `h ~ ε^(1/5) ≈ 7×10⁻⁴`. Con `h = 10⁻⁵` el redondeo sube a ~10⁻¹¹
y se convierte en un suelo de ruido que el controlador adaptativo persigue en vano. De ahí
que el trazador de órbitas use `DIFF_STEP = 10⁻³` y acote la tolerancia por debajo con
`ORBIT_TOL_FLOOR`: pedir más precisión que la de las propias derivadas es contraproducente.

### Cámara

Observador **ZAMO** (marco localmente no rotante). A gran `r` degenera al observador
estático, pero el ZAMO es el correcto si acercas la cámara dentro de la ergosfera,
donde no existe ningún observador estático. La aberración relativista y el arrastre de
marcos salen gratis de construir el rayo en su tetrada ortonormal.

### Disco de acreción

Disco delgado ecuatorial con borde interno en el ISCO, perfil de temperatura de
Novikov-Thorne `T ∝ r^(−3/4)[1 − √(r_in/r)]^(1/4)` normalizado a su máximo en
`r = (49/36) r_in`, y órbitas circulares con la `Ω` exacta de Kerr-Newman.

El corrimiento total es **un solo factor** que engloba Doppler y redshift gravitacional:

```
g = (p·u)_cámara / (p·u)_disco = 1 / [u^t (E − Ω L)]
```

Y aquí hay un punto que la app trata con más cuidado de lo habitual. La radiación
observada de un cuerpo negro a `T` con corrimiento `g` es **exactamente** un cuerpo
negro a `g·T`:

```
I_ν(obs) = g³ B_ν(ν/g, T) = B_ν(ν, g·T)
```

(identidad comprobada en los tests). Por eso el shader no aplica un `g⁴` sobre un color
fijo: consulta la LUT de cuerpo negro directamente en `g·T`, lo que da brillo y color
correctos a la vez. La consecuencia es que **el contraste del beaming depende de la
temperatura**: con el pico de Wien muy por debajo del visible el contraste va como `g`,
y el conocido `g⁴` es el valor *bolométrico*, no el de banda visible. Baja la tasa de
acreción hasta `T ~ 6000 K` y la asimetría se vuelve exponencialmente más marcada.

### Capas geométricas

El horizonte, la ergosfera, la esfera de fotones, el ISCO y la malla de arrastre se
detectan **dentro del trazador**, en los cruces reales del rayo. Aparecen por tanto con
su lente gravitacional correcto: son la imagen real de esas superficies, no un dibujo
superpuesto.

El horizonte de Cauchy `r₋` no se puede dibujar así: está dentro de `r₊` y ningún rayo
lo alcanza. Es causalmente inaccesible por construcción, y el HUD lo reporta como número.

### Rendimiento

El coste es intrínseco: un rayo integrado por píxel. La estrategia es de dos modos.

- **Tiempo real** (arrastrando, o con el disco rotando): resolución reducida, una
  muestra, presupuesto de pasos recortado.
- **Reposo**: resolución plena y acumulación de una muestra jittereada por frame
  (secuencia de Halton) hasta el objetivo. El anillo de fotones y el fondo lensado
  convergen sin ruido en 1-3 s.

Animar y acumular son incompatibles: la media corrida solo converge con la escena
quieta. Por eso el disco arranca **pausado** (barra espaciadora lo alterna) y rotarlo
fuerza el modo de tiempo real.

La **calidad adaptativa** baja la resolución interna si la GPU no llega. Conviene
dejarla activa: un solo pase demasiado largo puede disparar el watchdog del driver
(en Windows, TDR a los ~2 s), lo que pierde el contexto WebGL y deja el canvas en negro.

---

## Dos agujeros negros

**No existe solución exacta de las ecuaciones de Einstein para dos agujeros negros.**
El problema de dos cuerpos en relatividad general no está resuelto analíticamente, y las
simulaciones reales de fusiones son relatividad numérica: ecuaciones de campo completas
en una malla 3D, meses de supercomputador por fusión.

Lo que sí es exacto son los **datos iniciales de Brill-Lindquist**, solución exacta de
las *ligaduras* de Einstein (la ligadura hamiltoniana con `K_ij = 0`) para dos agujeros
momentáneamente estáticos:

```
ψ = 1 + m₁/(2r₁) + m₂/(2r₂)
ds² = −α² dt² + ψ⁴ (dx² + dy² + dz²),    α = 2/ψ − 1
```

El lapso no lo fijan las ligaduras (es libertad de gauge); se toma la elección que
generaliza el caso de un agujero, y con ella el horizonte queda en `ψ = 2` exactamente.

Las ecuaciones salen más simples que Kerr-Newman, porque la métrica es conformemente
plana y solo hacen falta `ψ` y su gradiente:

```
dxⁱ/dλ = pᵢ/ψ⁴
dpᵢ/dλ = −E² ∂ᵢα/α³ + 2|p|² ∂ᵢψ/ψ⁵      con  ∂ᵢα = −2∂ᵢψ/ψ²
```

Al haber dos punturas se pierde la simetría axial: no hay análogo de `L` y hay que
integrar las tres componentes del momento. La métrica sigue siendo estática, así que
`E = −p_t` se conserva.

### Por qué esto se puede validar

Con `m₂ = 0`, Brill-Lindquist es **exactamente** Schwarzschild en coordenadas isótropas.
El integrador está escrito en cartesianas isótropas y no explota ninguna simetría, así
que reproducir `√27 M` por esa vía es una verificación independiente del trazador de
Boyer-Lindquist: dos rutas de coordenadas distintas hacia el mismo número. En CPU sale a
tres decimales; medido sobre los píxeles del shader, al 1.4 %.

Un detalle que costó localizar: el parámetro de impacto es una cantidad **asintótica**,
`b = L/E = b_coord·ψ²/α`. A `x₀ = 2000 M` el factor vale 1.001, y confundirlo con el
desplazamiento coordenado introduce justo el 0.1 % de discrepancia que se observaba.

### Órbitas: dinámica post-newtoniana

Las posiciones de las dos punturas las dicta `physics/pn.ts`, **no** las ecuaciones de
Einstein: la métrica de Brill-Lindquist es una instantánea y no evoluciona por sí sola.
Una secuencia de instantáneas a separaciones decrecientes no es una fusión simulada, y la
interfaz lo declara.

Lo que sí es riguroso es la dinámica. Las ecuaciones de Peters (1964) para el decaimiento
orbital por emisión de ondas gravitacionales se validan contra una medida real: el púlsar
binario de Hulse-Taylor (PSR B1913+16) tiene un decaimiento medido de `−2.4025×10⁻¹² s/s`,
y estas fórmulas lo reproducen dentro del 2 %. Ese acuerdo fue el Nobel de 1993.

### Ondas gravitacionales

Fórmula del cuadrupolo a orden dominante. La relación de chirp
`df/dt = (96/5)π^(8/3)(GM_c/c³)^(5/3) f^(11/3)` y la amplitud `h ∝ M_c^(5/3)/D` se validan
por sus exponentes y contra GW150914 (masa de chirp ~28 M☉, `h ~ 10⁻²¹` a 410 Mpc,
luminosidad de pico ~10⁴⁹ W).

El chirp se sonifica con la frecuencia **real** de la onda: para masas estelares cae
directamente en el rango audible, que es la razón de que el chirp de LIGO se pueda
escuchar sin transponer. Para masas supermasivas la frecuencia es de nanohercios, y
entonces se transpone por octavas y se indica el factor en el HUD, en lugar de reproducir
un silencio o mentir sobre la frecuencia.

**Límite declarado del modelo**: el inspiral corta en `a = 6M`, donde la aproximación
post-newtoniana deja de ser defendible. Para GW150914 eso son unos 65 Hz, mientras que el
pico observado fue de ~250 Hz: esa diferencia es exactamente la fusión propiamente dicha,
que este modelo no cubre.

**Otros límites**: `m₁` y `m₂` son masas de puntura, no masas de horizonte (la masa ADM
total sí es exactamente `m₁+m₂`); y la solución es conformemente plana, luego estos
agujeros **no giran ni tienen carga**. Para espín haría falta Bowen-York, y con `K_ij ≠ 0`
la geodésica necesitaría la evolución completa.

---

## Cuerpos en órbita: planetas y estrellas

Un planeta o una estrella orbitando un agujero negro **es** una partícula de prueba: su
masa es despreciable frente a la del agujero, así que no perturba la métrica y sigue
exactamente una geodésica temporal del fondo fijo. No es una aproximación newtoniana ni un
modelo: es relatividad general exacta, y la calcula el integrador ya validado de
`orbits.ts`.

Hay comprobación observacional directa: **S2** orbita Sgr A* con un periastro de ~1400
radios gravitacionales, y su precesión del periastro (unos 12 minutos de arco por órbita)
la midió GRAVITY en 2020 de acuerdo con RG. El catálogo incluye sus parámetros reales.

La app avisa cuando la razón de masas supera `10⁻³`, porque por encima de ahí el cuerpo
empieza a perturbar la métrica y tratarlo como geodésica del fondo deja de ser defendible.

### Disrupción por marea

```
r_t ≈ R (M_BH / m)^(1/3)
```

Y de ahí un resultado contraintuitivo que la app hace visible: en unidades de `r_g`,

```
r_t/r_g ∝ M_BH^(−2/3)
```

es decir, el radio de marea **crece al disminuir** la masa del agujero. Una estrella como
el Sol se rompe a unos **47 r_g** de un agujero de 10⁶ M☉ —fuera del horizonte, y de ahí
que los eventos de disrupción sean observables— pero alrededor de M87* el radio de marea
cae a **0.14 r_g**, dentro del horizonte: en los agujeros supermasivos **las estrellas caen
enteras**. El marcador se pone rojo al cruzar el radio de marea, y el aviso distingue los
dos casos.

Lo que la app **no** hace: simular los restos. Modelar la disrupción exige hidrodinámica,
no una geodésica.

### Los dos relojes

El integrador lleva las dos cuentas a lo largo del camino: el tiempo **propio** `τ` (el
parámetro afín, que con la normalización `H = −1/2` es el tiempo propio del cuerpo) y el
tiempo **coordenado** `t`, que viaja en `path[i][0]`. La animación puede recorrer la
trayectoria con cualquiera de los dos, y la diferencia no es un detalle: en tiempo
coordenado un cuerpo que cae parece frenarse y no llegar nunca al horizonte, mientras que
en su propio reloj lo cruza en un tiempo finito y corriente.

El test lo comprueba de la forma correcta, que no es una razón fija entre relojes sino un
comportamiento asintótico: al acercar el punto de parada al horizonte, el tiempo propio
**converge** y el coordenado **crece sin cota** (logarítmicamente, `t ~ −2M ln(r/2M − 1)`).
Por eso una parada al 1 % del horizonte solo da una razón de ~1.2.

Ese 1 % (`CAPTURE_MARGIN`) no es arbitrario: por debajo de ~0.5 % el paso adaptativo se
estanca persiguiendo las derivadas divergentes de `H` —que aquí son numéricas— y la caída
no llega a completarse. Es el suelo práctico del método, medido.

---

## Galaxias de fondo: lente gravitacional

**Las galaxias no orbitan agujeros negros.** Una galaxia tiene ~10¹¹ masas solares y ~30
kpc de diámetro: es mucho más masiva y más grande que cualquier agujero negro, así que el
agujero está en *su* centro, no al revés. Ponerla en órbita como masa puntual invertiría la
jerarquía de tamaños.

Lo que sí es real, y es lo que implementa la app, es el **lente gravitacional de galaxias
de fondo**: arcos, imágenes múltiples y anillos de Einstein. Es astronomía observacional
corriente (Hubble, JWST en los cúmulos con lente).

La implementación es deliberadamente pasiva: no se dibuja ningún arco. Se define el perfil
de brillo de la galaxia en el **cielo asintótico** —disco exponencial (Sérsic `n = 1`) más
una componente central concentrada, con modulación espiral logarítmica opcional, proyectado
gnomónicamente y achatado por su razón de ejes— y la deformación la produce el propio
trazado de geodésicas al muestrear ese perfil con la dirección de escape de cada rayo. Con
una galaxia alineada detrás del agujero sale un anillo de Einstein completo, con su
estructura doble: el borde interior más brillante es el núcleo lensado y el arco exterior el
disco.

Un detalle de implementación que costó localizar: las galaxias se colocan como
desplazamientos angulares **alrededor de la dirección opuesta a la cámara**, no en
posiciones fijas del cielo. Con direcciones arbitrarias caen fuera del campo de visión y no
aportan nada de luz, lo que dejaba la función inservible salvo con el alineado activo.

---

## La malla del espaciotiempo

La superficie que se dibuja es el **embedding isométrico** de la rebanada ecuatorial:
el paraboloide de Flamm generalizado a Kerr-Newman.

```
z(r) = √(8M(r − 2M))        (Schwarzschild)
```

Isométrico significa que las distancias medidas sobre la superficie son las distancias
propias reales de esa rebanada. Se comprueba de inmediato:

```
dz/dr = √(2M/(r−2M))
dr² + dz² = dr²(1 + 2M/(r−2M)) = dr²/(1 − 2M/r)
```

que es exactamente la parte radial de la métrica inducida. La forma no es decorativa.

### La trampa de la cama elástica

Es la imagen más usada y la más malinterpretada de la relatividad general. El alcance real:

- Es **una rebanada espacial** (`t` constante, plano ecuatorial), no el espaciotiempo.
- La altura es una **dimensión auxiliar de inmersión**. No existe físicamente y nada cae
  "hacia abajo" por ella.
- Y lo decisivo: **la curvatura del espacio no es lo que hace caer a los objetos.** Para
  velocidades bajas, casi toda la gravedad newtoniana proviene de la curvatura del
  **tiempo**, es decir del gradiente de `g_tt`.

Por eso la malla se colorea por el **lapso** `α = √(−g_tt) = dτ/dt`: azul en la garganta,
donde el tiempo casi se detiene, y blanco cálido en el borde. En esta vista **el color
importa más que la forma**, y el HUD acompaña con la distancia propia frente a la
coordenada (de `r₊` a `10M` hay 11.8 M propios contra 8 M coordenados).

Dentro de la ergosfera no existe observador estático, así que `−g_tt < 0` y el lapso deja
de ser el ritmo de nadie: se marca en magenta en lugar de pintar un número sin significado.

### El límite de Smarr

Con la superficie del horizonte activada aparece un resultado clásico y comprobable: la
2-geometría del horizonte de Kerr **no admite inmersión isométrica en espacio euclídeo**
para `a/M > √3/2 ≈ 0.866` (Smarr 1973). Desarrollando el radicando cerca del polo sale
`θ²(r₊² + a² − 4a²)`, que exige `r₊² ≥ 3a²`; con `a = √3/2` resulta `r₊ = 1.5` y
`r₊² = 2.25 = 3a²` exactamente. Por encima de ese espín el horizonte está demasiado
achatado en los polos para caber, y hay que sumergirlo en Minkowski. La app lo marca en
rojo y el casquete no sumergible crece con el espín.

Ojo con no confundirlo con la rebanada ecuatorial, que sí se puede sumergir a cualquier
espín (ahí `g_rr = r²/Δ` diverge en el horizonte y el radicando se mantiene positivo). Son
dos afirmaciones distintas.

---

## Validación

Es lo que respalda la palabra «simulación». Dos niveles independientes.

### Física en CPU — `npm test`

83 tests sobre las funciones puras de `src/physics/`, contra resultados analíticos
cerrados:

| Comprobación | Referencia |
|---|---|
| Esfera de fotones Schwarzschild | `3 M` |
| Radio de sombra Schwarzschild | `3√3 M = √27 M` |
| ISCO Schwarzschild | `6 M`, con `E = 2√2/3` y eficiencia 5.72 % |
| ISCO Kerr, cualquier espín | forma cerrada de Bardeen-Press-Teukolsky |
| Órbita de fotones Kerr | `2{1 + cos[(2/3) arccos(∓a)]}` |
| Reissner-Nordström extremal | `r₊ = M`, `r_ph = 2M`, `b_c = 4M` |
| Deflexión de la luz | serie `4/b + 15π/(4b²) + 128/(3b³)` **hasta tercer orden** |
| Borde de sombra Kerr-Newman | idéntico a las expresiones clásicas de Bardeen para `q = 0` |
| Velocidad angular orbital | `Ω = 1/(r^{3/2} + a)` |
| Contraste tangencial del beaming | `(√(r−2)+1)/(√(r−2)−1)`, exactamente 3 en el ISCO |
| Precesión del periastro | `2π[(1−6M/p)^(−1/2) − 1)]`, exacta (no solo `6πM/p`) |
| Precesión nodal Lense-Thirring | escala `∝ a·r^(−3/2)`, simetría de paridad `a→−a` con `φ→−φ` |
| Conservación del hamiltoniano | `|ΔH|/E² < 10⁻⁹` en una travesía completa |
| Conservación de la constante de Carter | deriva relativa `< 10⁻⁸` |
| Fuerza de Lorentz | una partícula cargada se separa de la geodésica; el signo importa |

### Render en GPU — `npm run verify:gpu`

Seis herramientas que miden la **imagen que produce el shader**, no el código de CPU.
Requieren el servidor de desarrollo levantado, y **no hay que editar `src/` mientras
corren**: el HMR de Vite recargaría la página a mitad de la medición (las herramientas lo
detectan y lo dicen, en vez de soltar una traza inútil).

Una nota sobre reproducibilidad: la **calidad adaptativa debe estar desactivada** en
cualquier medición sobre píxeles. Ajusta la resolución interna a la velocidad de la GPU, y
las medidas de radio de sombra dependen de la resolución; con ella activa se observó un
desplazamiento del 3 % bajo rasterizado software.

`verify:shadow` mide el radio de la sombra en píxeles y lo compara con la predicción:

| Caso | Medido | Analítico | Error |
|---|---|---|---|
| Schwarzschild | 5.1945 M | `√27` = 5.1962 M | **0.03 %** |
| RN extremal `q=1` | 4.0028 M | 4 M | **0.07 %** |
| Kerr `a=0.9`, 20° | 4.9373 M | 4.9188 M | 0.38 % |
| Kerr `a=0.9` de canto | 4.9603 M | 5.0294 M | 1.4 % |

Y además: la asimetría de forma de Kerr de canto (0.0508 medida frente a 0.0441
analítica), el desplazamiento del centroide por arrastre de marcos, y que la carga y el
espín contraen la sombra monótonamente.

`verify:doppler` mide el contraste de radiancia entre los dos lados del disco. Dos
decisiones de medida importan más que el resultado:

- Se mide sobre el **búfer de acumulación en coma flotante**, no sobre el canvas. ACES
  comprime el rango alto: un contraste físico de 1.4× se aplasta a un ~2 % de diferencia
  en los bytes de salida, con ambos lados cerca de la saturación. Medir ahí no distingue
  «hay poco beaming» de «hay beaming y el tonemap lo esconde».
- Se compara el **percentil 98** de cada lado, no la media. La banda de medición cubre
  áreas de disco muy distintas a cada lado —el arrastre de marcos desplaza la sombra, y
  las caras cercana y lejana se proyectan de forma diferente: 1239 px frente a 235 px en
  el caso de canto—, así que una media mezcla cuánto disco hay con cuánto brilla. Con
  medias, el lado brillante llega a parecer que *no* cambia al invertir la rotación.

| Escena | `T_máx` | Contraste medido |
|---|---|---|
| Disco caliente, de canto | 3.16×10⁵ K | **1.23×** (régimen Rayleigh-Jeans, `∝ g`) |
| Disco frío, de canto | 5.95×10³ K | **4.15×** (pico de Wien en el visible) |
| Disco caliente, desde el eje | 3.16×10⁵ K | 1.05× (movimiento transversal) |

Es la confirmación más directa del tratamiento espectral: el contraste depende de dónde
cae el pico de Wien respecto a la banda visible, exactamente como predice consultar la LUT
en `g·T` en lugar de aplicar un `g⁴` sobre un color fijo. Comprueba además que invertir la
rotación cambia de lado el brillo, y que el lado brillante es el mismo con disco frío que
con disco caliente.

`verify:ui` comprueba que la interfaz sea **visible**: qué elemento ocupa cada punto de la
pantalla vía `elementFromPoint`, no solo qué hay en el DOM. Existe por un fallo real que
inspeccionar el DOM no detectaba: un overlay a pantalla completa marcado con el atributo
`hidden` seguía visible porque el CSS le daba `display: flex`, y una regla de autor gana a
la hoja del navegador que implementa `hidden` con `display: none`. Tapaba toda la
aplicación tras un `z-index: 100` opaco, y el síntoma era una pantalla completamente negra
sin ningún error en consola.

`verify:binary` mide la imagen del trazador de dos agujeros. La prueba fuerte es la misma
que en CPU pero sobre píxeles: con `m₂ → 0` debe reproducir `√27·m₁`, y sale al 1.4 %.
Comprueba además que con masas iguales hay dos sombras separadas y de tamaño comparable, y
que con 80/20 la del agujero masivo es claramente mayor.

Dos detalles de geometría que costaron localizar y que valen para cualquiera que mida
sobre esta escena: la binaria yace en el plano `z = 0` y con `ν = 0` su separación va a lo
largo de `x`, así que una cámara con inclinación 90° y azimut 0 se coloca **sobre la línea
que une los dos agujeros**, con uno detrás del otro (las sombras salen concéntricas). Y con
masas desiguales el centro de masas no coincide con ningún agujero: medir la distancia al
origen en vez de a la puntura sesga el radio (con reparto 0.98/0.02 y `a = 200 M` el
desfase es de 4 M, un 7 %).

`verify:mesh` comprueba que la malla se dibuja con estructura, que el gradiente de lapso
oscurece el centro respecto al borde, que sin coloreo ese contraste desaparece, que la
distancia propia supera la coordenada, y que el horizonte deja de ser sumergible por
encima de `√3/2`.

`verify:bodies` comprueba los cuerpos animados y las galaxias lensadas: que el marcador se
coloca en el radio pedido, que se mueve al avanzar el reloj, que el recorrido dura más en
tiempo coordenado que en propio, que una gigante roja llega a desgarrarse por marea, y que
una galaxia alineada detrás del agujero reparte su luz en un anillo alrededor de la sombra
en lugar de un disco central. El discriminador de esto último es **en qué anillo radial cae
el pico de brillo**, no el valor de un anillo concreto: comparar un anillo fijo no
distingue las dos configuraciones.

`verify:smoke` valida que los shaders compilan, que la imagen converge y que no hay
errores de GL. Esto último es menos obvio de lo que parece: los errores de GL llegan como
*warnings* de consola, no como excepciones, y un `drawArrays` rechazado deja el canvas en
negro sin ningún error de compilación. Ocurrió con un `samplerCube` declarado y sin
enlazar, que se quedaba en la unidad de textura 0 y colisionaba con el primer `sampler2D`:
en GLES eso invalida el dibujado completo aunque la rama del cubemap nunca se ejecute.

```bash
npm run verify        # typecheck + tests + las cuatro herramientas de GPU
```

Herramientas de diagnóstico, para cuando algo va mal: `npm run diag` (estado del DOM y
del contexto GL), `probe:accum` (lee el búfer de acumulación en coma flotante),
`probe:orbit` y `probe:isco`.

---

## Límites declarados

Lo que esta app **no** hace, dicho explícitamente:

- **El overlay de órbitas no es físicamente consistente.** Las polilíneas se proyectan
  suponiendo que la luz viaja en línea recta, mientras que la imagen de fondo sí sigue
  geodésicas. Es un diagrama en el espacio de coordenadas superpuesto a una observación:
  una órbita que pase por detrás del agujero *debería* verse deformada por el lente, y
  aparece recta. La UI lo etiqueta como «vista esquemática». Hacerlo bien exigiría trazar
  geodésicas nulas desde cada punto de la órbita hasta la cámara.
- **El disco es geométricamente delgado y ópticamente fino**, sin transferencia radiativa
  completa ni MHD. Es el modelo estándar de Novikov-Thorne, no una simulación GRMHD.
- **La carga no es astrofísica** (ver arriba).
- **Sin física dentro del horizonte.** Los rayos terminan en `r₊`.
- **Precisión reducida junto al eje de espín.** Las coordenadas de Boyer-Lindquist tienen
  una singularidad de coordenadas en el eje (los términos `1/sin θ`). Un rayo con `L ≠ 0`
  nunca la alcanza en aritmética exacta, y para `L = 0` esos términos se anulan, así que
  es solo numérica — pero mirando casi de frente al eje la precisión se degrada unos
  puntos porcentuales.
- **Precisión reducida en el régimen casi extremal** `a² + q² → 1`: los dos horizontes
  casi coinciden y la coma flotante de 32 bits del shader se degrada junto a `r₊`. Los
  observables del HUD, calculados en doble precisión, siguen siendo fiables. La app avisa.
- **Singularidad desnuda** (`a² + q² > 1`): se permite renderizar porque es una solución
  exacta e instructiva, con la advertencia de que viola la censura cósmica y no se espera
  que exista. La terminación de rayos cerca de la singularidad en anillo es una elección
  de renderizado, no física.
- **El fondo estelar es procedural**, no un catálogo real. Sirve de referencia para leer
  la distorsión del lente; el color de cada estrella sí sale de la LUT de cuerpo negro.

---

## Estructura

```
src/
  physics/          núcleo validado, doble precisión, sin dependencias de render
    kerrNewman.ts     métrica, horizontes, ergosfera, ISCO, órbitas, ZAMO, corrimiento
    geodesic.ts       integrador RKF45 hamiltoniano para fotones
    orbits.ts         partículas de prueba, neutras y cargadas (fuerza de Lorentz)
    shadowRim.ts      borde analítico de la sombra (Bardeen), referencia independiente
    blackbody.ts      Planck → CIE XYZ → sRGB, y la LUT que consume el shader
    units.ts          geometrizado ↔ SI
  render/
    shaders/          metric.glsl es el espejo en GLSL de geodesic.ts
    Renderer.ts       WebGL2, acumulación progresiva, calidad adaptativa
    OrbitCamera.ts    arrastrar para orbitar, con inercia; táctil incluido
    OrbitOverlay.ts   overlay esquemático de órbitas
  state/params.ts   estado central y observables derivados
  ui/               panel, HUD, presets, avisos
tests/              83 tests contra resultados analíticos
tools/              verificación en GPU y diagnóstico
```

`src/physics/geodesic.ts` y `src/render/shaders/metric.glsl` son dos implementaciones de
la misma formulación: la de CPU está validada contra fórmulas cerradas, y la de GPU se
valida contra la imagen que produce. Cualquier cambio en una debe replicarse en la otra.

## Atajos

`H` panel · `J` HUD · barra espaciadora pausa la rotación del disco · arrastrar orbita ·
rueda o pinza acerca
