#!/usr/bin/env php
<?php

array_shift($argv);

$fp = fsockopen("udp://0.0.0.0", 4000, $errno, $errstr);
var_dump(json_encode($argv));
fwrite($fp, json_encode($argv));
fclose($fp);
