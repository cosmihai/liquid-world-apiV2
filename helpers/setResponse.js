function response(...argumentsList) {
	let success = true;
	let message = "Data retrieved successfully";
	let data = null;
  if (argumentsList.length) {
    argumentsList.forEach((arg) => {
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