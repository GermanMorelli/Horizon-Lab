# Contribuir · Contributing

**Los forks, los arreglos de issues y las discusiones son bienvenidos.**
**Forks, issue fixes and discussions are welcome.**

> Elige tu idioma · Choose your language:
> [Español](#español) · [English](#english) · [Português](#português) · [Français](#français) · [Deutsch](#deutsch) · [Italiano](#italiano) · [中文（简体）](#中文简体) · [日本語](#日本語) · [Русский](#русский)

Repositorio · Repository: <https://github.com/GermanMorelli/Horizon-Lab>

---

## Español

Este proyecto es abierto en el sentido literal: **haz un fork, arregla lo que veas roto, abre discusiones.** No hace falta pedir permiso para nada de eso. La licencia es MIT.

**Qué es especialmente bienvenido**

- **Forks.** Llévatelo, cámbialo, publica tu versión. Si haces algo interesante con él, cuéntalo en una discusión — da gusto verlo.
- **Arreglos de issues.** Cualquier issue abierto está disponible; comenta en él para que nadie duplique trabajo y ya está.
- **Discusiones.** Preguntas de física, dudas sobre el modelo, ideas de escenarios nuevos, "creo que esta aproximación está mal": todo eso vale. Si Discussions no está habilitado, abre un issue.
- **Correcciones de física.** Si encuentras un signo, un factor o un límite mal puesto, es la contribución más valiosa que existe aquí. Trae la referencia y se corrige.
- **Traducciones y documentación.** Incluido traducir este archivo o el README a tu idioma.

**Antes de abrir un PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # la batería de pruebas
npm run typecheck
```

Si tocas física, con el servidor de desarrollo levantado:

```bash
npm run verify     # typecheck + pruebas + las comprobaciones que miden la imagen
```

**Tres cosas que conviene saber del código**

1. **El integrador de CPU y el de GPU son el mismo modelo.** `src/physics/` (TypeScript, doble precisión) y `src/render/shaders/` (GLSL) implementan las mismas ecuaciones. Si cambias uno, cambia el otro; si no, las pruebas lo detectan.
2. **Las pruebas comparan contra resultados conocidos**, no contra el código: la sombra de Schwarzschild mide √27, la esfera de fotones sale en 3, el ISCO en 6. Si tu cambio mueve uno de esos números, algo está mal — o has encontrado un error de verdad.
3. **Nada de efectos falsos.** Aquí la imagen se calcula; si algo es aproximado o esquemático, se declara en el README y en [docs/TECNICO.md](docs/TECNICO.md). Una aproximación documentada es bienvenida; una aproximación disfrazada de física no.

**Estilo**

PRs pequeños y con una sola intención. Explica *por qué*, no *qué* (el diff ya dice qué). Los comentarios, los mensajes de commit y la conversación **pueden ir en tu idioma**; el código y los identificadores en el estilo que ya tiene el repo.

---

## English

This project is open in the literal sense: **fork it, fix what looks broken, start discussions.** You don't need permission for any of that. The license is MIT.

**Especially welcome**

- **Forks.** Take it, change it, publish your version. If you build something interesting with it, post about it in a discussion — it's genuinely nice to see.
- **Issue fixes.** Any open issue is up for grabs; just comment on it so nobody duplicates the work.
- **Discussions.** Physics questions, doubts about the model, ideas for new scenarios, "I think this approximation is wrong" — all fair game. If Discussions isn't enabled, open an issue.
- **Physics corrections.** A wrong sign, a wrong factor, a misplaced limit: that's the single most valuable contribution here. Bring the reference and it gets fixed.
- **Translations and docs.** Including translating this file or the README into your language.

**Before opening a PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # the test suite
npm run typecheck
```

If you touch physics, with the dev server running:

```bash
npm run verify     # typecheck + tests + the checks that measure the rendered image
```

**Three things worth knowing about the code**

1. **The CPU and GPU integrators are one model.** `src/physics/` (TypeScript, double precision) and `src/render/shaders/` (GLSL) implement the same equations. Change one, change the other — otherwise the tests will catch you.
2. **Tests compare against known results**, not against the code: the Schwarzschild shadow measures √27, the photon sphere lands at 3, the ISCO at 6. If your change moves one of those numbers, something is wrong — or you found a real bug.
3. **No fake effects.** The image here is computed; anything approximate or schematic is declared in the README and in [docs/TECNICO.md](docs/TECNICO.md). A documented approximation is welcome; an approximation dressed up as physics is not.

**Style**

Small PRs with a single intent. Explain *why*, not *what* (the diff already says what). Comments, commit messages and conversation **may be in your own language**; code and identifiers follow the style already in the repo.

---

## Português

Este projeto é aberto no sentido literal: **faça um fork, corrija o que estiver quebrado, abra discussões.** Não é preciso pedir permissão para nada disso. A licença é MIT.

**O que é especialmente bem-vindo**

- **Forks.** Leve, modifique, publique a sua versão. Se fizer algo interessante com ele, conte numa discussão — é ótimo ver.
- **Correções de issues.** Qualquer issue aberto está disponível; comente nele para ninguém duplicar trabalho.
- **Discussões.** Perguntas de física, dúvidas sobre o modelo, ideias de novos cenários, "acho que esta aproximação está errada": tudo vale. Se Discussions não estiver habilitado, abra um issue.
- **Correções de física.** Um sinal trocado, um fator errado, um limite mal colocado: é a contribuição mais valiosa daqui. Traga a referência e corrigimos.
- **Traduções e documentação.** Inclusive traduzir este arquivo ou o README para o seu idioma.

**Antes de abrir um PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # a bateria de testes
npm run typecheck
```

Se mexer na física, com o servidor de desenvolvimento no ar:

```bash
npm run verify     # typecheck + testes + as verificações que medem a imagem
```

**Três coisas sobre o código**

1. **Os integradores de CPU e GPU são o mesmo modelo.** `src/physics/` (TypeScript, precisão dupla) e `src/render/shaders/` (GLSL) implementam as mesmas equações. Se mudar um, mude o outro — senão os testes acusam.
2. **Os testes comparam com resultados conhecidos**, não com o código: a sombra de Schwarzschild mede √27, a esfera de fótons dá 3, a ISCO dá 6. Se a sua mudança move um desses números, algo está errado — ou você encontrou um bug real.
3. **Sem efeitos falsos.** Aqui a imagem é calculada; o que é aproximado ou esquemático está declarado no README e em [docs/TECNICO.md](docs/TECNICO.md). Aproximação documentada é bem-vinda; aproximação disfarçada de física não.

**Estilo**

PRs pequenos e com uma única intenção. Explique *por quê*, não *o quê* (o diff já diz o quê). Comentários, mensagens de commit e conversa **podem ser no seu idioma**; código e identificadores seguem o estilo do repositório.

---

## Français

Ce projet est ouvert au sens littéral : **forkez-le, corrigez ce qui est cassé, ouvrez des discussions.** Aucune permission n'est nécessaire. La licence est MIT.

**Particulièrement bienvenus**

- **Les forks.** Prenez-le, modifiez-le, publiez votre version. Si vous en faites quelque chose d'intéressant, racontez-le dans une discussion — c'est un plaisir à voir.
- **Les corrections d'issues.** Toute issue ouverte est disponible ; commentez-la simplement pour éviter le travail en double.
- **Les discussions.** Questions de physique, doutes sur le modèle, idées de nouveaux scénarios, « je crois que cette approximation est fausse » : tout est légitime. Si Discussions n'est pas activé, ouvrez une issue.
- **Les corrections de physique.** Un signe, un facteur ou une limite mal placés : c'est la contribution la plus précieuse ici. Apportez la référence et c'est corrigé.
- **Traductions et documentation.** Y compris traduire ce fichier ou le README dans votre langue.

**Avant d'ouvrir une PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # la suite de tests
npm run typecheck
```

Si vous touchez à la physique, avec le serveur de dev lancé :

```bash
npm run verify     # typecheck + tests + les vérifications qui mesurent l'image
```

**Trois choses à savoir sur le code**

1. **Les intégrateurs CPU et GPU sont un seul modèle.** `src/physics/` (TypeScript, double précision) et `src/render/shaders/` (GLSL) implémentent les mêmes équations. Si vous modifiez l'un, modifiez l'autre — sinon les tests le verront.
2. **Les tests comparent à des résultats connus**, pas au code : l'ombre de Schwarzschild mesure √27, la sphère de photons tombe à 3, l'ISCO à 6. Si votre changement déplace l'un de ces nombres, quelque chose est faux — ou vous avez trouvé un vrai bug.
3. **Pas d'effets factices.** Ici l'image est calculée ; tout ce qui est approximatif ou schématique est déclaré dans le README et dans [docs/TECNICO.md](docs/TECNICO.md). Une approximation documentée est bienvenue ; une approximation déguisée en physique, non.

**Style**

Des PR petites, avec une seule intention. Expliquez *pourquoi*, pas *quoi* (le diff dit déjà quoi). Commentaires, messages de commit et discussion **peuvent être dans votre langue** ; le code et les identifiants suivent le style déjà présent.

---

## Deutsch

Dieses Projekt ist offen im wörtlichen Sinn: **forke es, repariere was kaputt aussieht, eröffne Diskussionen.** Dafür braucht es keine Erlaubnis. Die Lizenz ist MIT.

**Besonders willkommen**

- **Forks.** Nimm es, ändere es, veröffentliche deine Version. Wenn daraus etwas Interessantes entsteht, erzähl davon in einer Diskussion — das sieht man gern.
- **Fixes für Issues.** Jedes offene Issue ist frei; kommentiere kurz darunter, damit niemand doppelt arbeitet.
- **Diskussionen.** Physikfragen, Zweifel am Modell, Ideen für neue Szenarien, „ich glaube, diese Näherung ist falsch": alles erlaubt. Falls Discussions nicht aktiviert ist, eröffne ein Issue.
- **Physik-Korrekturen.** Ein falsches Vorzeichen, ein falscher Faktor, eine falsch gesetzte Grenze: das ist hier der wertvollste Beitrag überhaupt. Bring die Referenz mit, dann wird es korrigiert.
- **Übersetzungen und Dokumentation.** Auch die Übersetzung dieser Datei oder des README in deine Sprache.

**Vor einem PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # die Testsuite
npm run typecheck
```

Wenn du an der Physik arbeitest, mit laufendem Dev-Server:

```bash
npm run verify     # typecheck + Tests + die Prüfungen, die das Bild ausmessen
```

**Drei Dinge über den Code**

1. **CPU- und GPU-Integrator sind ein Modell.** `src/physics/` (TypeScript, doppelte Genauigkeit) und `src/render/shaders/` (GLSL) implementieren dieselben Gleichungen. Änderst du eins, ändere das andere — sonst merken es die Tests.
2. **Die Tests vergleichen mit bekannten Ergebnissen**, nicht mit dem Code: der Schwarzschild-Schatten misst √27, die Photonensphäre liegt bei 3, die ISCO bei 6. Verschiebt deine Änderung eine dieser Zahlen, ist etwas falsch — oder du hast einen echten Fehler gefunden.
3. **Keine vorgetäuschten Effekte.** Das Bild wird hier gerechnet; was näherungsweise oder schematisch ist, steht offen im README und in [docs/TECNICO.md](docs/TECNICO.md). Eine dokumentierte Näherung ist willkommen; eine als Physik verkleidete Näherung nicht.

**Stil**

Kleine PRs mit einer Absicht. Erkläre *warum*, nicht *was* (das Was steht im Diff). Kommentare, Commit-Messages und Diskussion **dürfen in deiner Sprache sein**; Code und Bezeichner folgen dem Stil im Repo.

---

## Italiano

Questo progetto è aperto in senso letterale: **fai un fork, sistema ciò che è rotto, apri discussioni.** Non serve chiedere permesso. La licenza è MIT.

**Particolarmente graditi**

- **I fork.** Prendilo, modificalo, pubblica la tua versione. Se ne fai qualcosa di interessante, raccontalo in una discussione — fa piacere vederlo.
- **Le correzioni di issue.** Qualsiasi issue aperto è disponibile; commenta per evitare lavoro duplicato.
- **Le discussioni.** Domande di fisica, dubbi sul modello, idee per nuovi scenari, «credo che questa approssimazione sia sbagliata»: tutto è legittimo. Se Discussions non è attivo, apri un issue.
- **Le correzioni di fisica.** Un segno, un fattore o un limite sbagliati: è il contributo più prezioso qui. Porta il riferimento e si corregge.
- **Traduzioni e documentazione.** Compresa la traduzione di questo file o del README nella tua lingua.

**Prima di aprire una PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # la suite di test
npm run typecheck
```

Se tocchi la fisica, con il dev server attivo:

```bash
npm run verify     # typecheck + test + le verifiche che misurano l'immagine
```

**Tre cose sul codice**

1. **Gli integratori CPU e GPU sono lo stesso modello.** `src/physics/` (TypeScript, doppia precisione) e `src/render/shaders/` (GLSL) implementano le stesse equazioni. Se cambi uno, cambia l'altro — altrimenti lo scoprono i test.
2. **I test confrontano con risultati noti**, non con il codice: l'ombra di Schwarzschild misura √27, la sfera dei fotoni cade a 3, l'ISCO a 6. Se la tua modifica sposta uno di quei numeri, qualcosa non va — oppure hai trovato un bug reale.
3. **Nessun effetto finto.** Qui l'immagine si calcola; ciò che è approssimato o schematico è dichiarato nel README e in [docs/TECNICO.md](docs/TECNICO.md). Un'approssimazione documentata è benvenuta; un'approssimazione travestita da fisica no.

**Stile**

PR piccole e con una sola intenzione. Spiega *perché*, non *cosa* (il diff dice già cosa). Commenti, messaggi di commit e conversazione **possono essere nella tua lingua**; codice e identificatori seguono lo stile del repository.

---

## 中文（简体）

这个项目是字面意义上的开放：**欢迎 fork、欢迎修 issue、欢迎发起讨论。** 这些都不需要事先获得许可。许可证是 MIT。

**特别欢迎**

- **Fork。** 拿走、修改、发布你自己的版本。如果你用它做出了有意思的东西，欢迎在讨论区分享 —— 很期待看到。
- **修复 issue。** 任何开放的 issue 都可以认领；在下面留个言，避免重复劳动。
- **讨论。** 物理问题、对模型的疑问、新场景的想法、"我认为这个近似是错的" —— 都欢迎。如果 Discussions 未启用，就开一个 issue。
- **物理修正。** 一个符号、一个系数、一个放错位置的极限：这是这里最有价值的贡献。附上参考文献，就会被修正。
- **翻译与文档。** 包括把这个文件或 README 翻译成你的语言。

**提 PR 之前**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 测试套件
npm run typecheck
```

如果你改动了物理部分，在开发服务器运行的情况下：

```bash
npm run verify     # typecheck + 测试 + 对渲染结果直接测量的校验
```

**关于代码的三件事**

1. **CPU 与 GPU 的积分器是同一个模型。** `src/physics/`（TypeScript，双精度）与 `src/render/shaders/`（GLSL）实现的是同一组方程。改了一边就要改另一边 —— 否则测试会发现。
2. **测试对照的是已知结果**，不是代码本身：史瓦西阴影的半径是 √27，光子球在 3，ISCO 在 6。如果你的改动让这些数字变了，说明有问题 —— 或者你真的发现了一个 bug。
3. **不要假效果。** 这里的图像是算出来的；凡是近似或示意性的部分，都在 README 和 [docs/TECNICO.md](docs/TECNICO.md) 里明确声明。有文档说明的近似是受欢迎的；伪装成物理的近似不是。

**风格**

PR 尽量小，一次只做一件事。解释*为什么*，而不是*做了什么*（diff 已经说明了做了什么）。注释、commit 信息和讨论**可以用你自己的语言**；代码和标识符沿用仓库现有风格。

---

## 日本語

このプロジェクトは文字どおりオープンです。**fork も、issue の修正も、ディスカッションも歓迎します。** どれも事前の許可は不要です。ライセンスは MIT です。

**とくに歓迎するもの**

- **Fork。** 持っていって、変えて、あなたの版を公開してください。面白いものができたらディスカッションで教えてください — 見られるのが嬉しいです。
- **Issue の修正。** オープンな issue はどれでも手を挙げてかまいません。作業の重複を避けるため、ひとことコメントを残してください。
- **ディスカッション。** 物理の質問、モデルへの疑問、新しいシナリオのアイデア、「この近似は間違っていると思う」— どれも歓迎です。Discussions が有効でない場合は issue を立ててください。
- **物理の訂正。** 符号、係数、境界の置き方の誤り。ここではこれが最も価値のある貢献です。参考文献を添えてもらえれば修正します。
- **翻訳とドキュメント。** このファイルや README をあなたの言語に訳すことも含みます。

**PR を出す前に**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # テストスイート
npm run typecheck
```

物理に手を入れた場合は、開発サーバーを起動した状態で：

```bash
npm run verify     # typecheck + テスト + 描画結果を実測する検証
```

**コードについて知っておくべき三点**

1. **CPU と GPU の積分器は同一のモデルです。** `src/physics/`（TypeScript、倍精度）と `src/render/shaders/`（GLSL）は同じ方程式を実装しています。片方を変えたら、もう片方も変えてください — さもなければテストが気づきます。
2. **テストは既知の結果と比較します**（コードとではなく）。シュヴァルツシルトの影は √27、光子球は 3、ISCO は 6。あなたの変更でこれらの数値が動いたなら、どこかが誤っています — あるいは本物のバグを見つけたということです。
3. **見せかけの効果は入れません。** ここでは画像は計算されるものです。近似や模式的な表現は README と [docs/TECNICO.md](docs/TECNICO.md) に明記されています。文書化された近似は歓迎しますが、物理を装った近似は歓迎しません。

**スタイル**

PR は小さく、意図はひとつに。*なぜ*を説明してください、*なに*ではなく（なには diff が語ります）。コメント・コミットメッセージ・議論は**あなたの言語でかまいません**。コードと識別子はリポジトリ既存のスタイルに合わせてください。

---

## Русский

Этот проект открыт в буквальном смысле: **делайте форк, исправляйте то, что сломано, начинайте обсуждения.** Разрешения ни на что из этого не требуется. Лицензия — MIT.

**Особенно приветствуется**

- **Форки.** Берите, меняйте, публикуйте свою версию. Если получится что-то интересное — расскажите в обсуждении, это правда приятно видеть.
- **Исправления issue.** Любой открытый issue свободен; просто оставьте комментарий, чтобы работа не дублировалась.
- **Обсуждения.** Вопросы по физике, сомнения в модели, идеи новых сценариев, «кажется, это приближение неверно» — всё уместно. Если Discussions не включены, откройте issue.
- **Исправления физики.** Неверный знак, неверный множитель, не там поставленный предел: это самый ценный вклад здесь. Приложите ссылку на источник — и будет исправлено.
- **Переводы и документация.** В том числе перевод этого файла или README на ваш язык.

**Перед созданием PR**

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # набор тестов
npm run typecheck
```

Если вы затронули физику, при запущенном dev-сервере:

```bash
npm run verify     # typecheck + тесты + проверки, измеряющие само изображение
```

**Три вещи о коде**

1. **Интеграторы на CPU и на GPU — одна и та же модель.** `src/physics/` (TypeScript, двойная точность) и `src/render/shaders/` (GLSL) реализуют одни и те же уравнения. Меняете одно — меняйте и другое, иначе это заметят тесты.
2. **Тесты сравнивают с известными результатами**, а не с кодом: тень Шварцшильда равна √27, фотонная сфера — 3, ISCO — 6. Если ваше изменение сдвигает одно из этих чисел, что-то не так — или вы нашли настоящую ошибку.
3. **Никаких поддельных эффектов.** Изображение здесь вычисляется; всё приближённое или схематическое прямо объявлено в README и в [docs/TECNICO.md](docs/TECNICO.md). Документированное приближение приветствуется; приближение, выданное за физику, — нет.

**Стиль**

Небольшие PR с одним замыслом. Объясняйте *почему*, а не *что* (что — уже видно в диффе). Комментарии, сообщения коммитов и обсуждение **могут быть на вашем языке**; код и идентификаторы — в стиле, уже принятом в репозитории.
