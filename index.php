<?php
$xml = simplexml_load_file('levels/level1.xml', "SimpleXMLElement", LIBXML_NOCDATA);
$json = json_encode($xml);
$levelData = json_decode($json, true);
?>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cat House Adventure</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas" width="1024" height="576"></canvas>
  </div>
  <script>
    const LEVEL_DATA = <?php echo json_encode($levelData); ?>;
  </script>
  <script src="js/game.js"></script>
</body>
</html>
