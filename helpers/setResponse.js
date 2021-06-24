function response(...arguments) {
	let success = true;
	let message = "Data retrieved successfully";
	let data = null;
  if (arguments.length) {
    arguments.forEach((arg, index) => {
      switch (typeof arg) {
        case "boolean":
          success = arg;
          break;
        case "string":
          message = arg;
          break;
        case "object":
          data = arg;
          break;
      }
    });
  }
  return {success, message, data};
}

module.exports = response;