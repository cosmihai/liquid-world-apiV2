function validateId(...id) {
  let message = {
    valid: true,
    error: ''
  }; 

  for (let i = 0; i < id.length; i ++){
    if(!id[i]){
      message.valid = false;
      message.error = `id number ${i} is not valid`
    }
  }
  return message
}

console.log(validateId('1', '', '1'))