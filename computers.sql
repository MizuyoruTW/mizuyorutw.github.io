SELECT COUNT(*) FROM computers;
/*  2*/

SELECT type, id FROM computers;
/*  |type  |id|
    |------|--|
    |laptop|0 |
    |PC    |1 |*/

SELECT OS FROM computers;
/*  |OS            |id|
    |--------------|--|
    |Windows, Linux|0 |
    |Windows       |1 |*/

SELECT * FROM spec WHERE id = 0;
/*  |CPU            |GPU                               |RAM|
    |---------------|----------------------------------|---|
    |Intel i7-6700HQ|Intel HD graphics, Nvidia GTX 960M|16G|*/

SELECT * FROM spec WHERE id = 1;
/*  |CPU          |GPU            |RAM|
    |-------------|---------------|---|
    |Intel i5-8400|Nvidia GTX 1050|8G |*/