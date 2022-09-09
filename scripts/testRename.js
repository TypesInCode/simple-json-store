const fs = require("fs");

fs.rename("./test/DATA/compressStore.dat", "./test/DATA/compressStore.dat.test", (err) => {
    if(err)
        console.debug(err);

    console.log("END");
});