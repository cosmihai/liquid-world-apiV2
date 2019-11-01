
<h1 style="text-align: center">Liquid World Api V2 <h1> 



## Models

> __Restaurant__

- id: _string_

- name: _string_

- email: _string_

- password: _string_

- address: _object_
  - street: _string_
  - number: _string_
  - city: _string_
  - country: _string_
  
- phone: _string_

- description: _string_

- images: _[Object]_
  - imgName: _string_
  - imgPath: _string_
  
- rating: _object_
  - votes: _number_
  - stars: _number_

- comments: _[ObjectId, ref: comments]_

- capacity: _number_

- cuisine: _string_

- role: _string_

  

> __Customer__

- id: _string_

- username: _string_

- email: _string_

- password: _string_

- avatar: _object_
  - imgName: _string_
  - imgPath: _string_
  
- favRestaurants: _[object]_
  - restaurantId: _ObjectId_
  - name: _string_
  - city: _string_ 
  
- favBartender: _[object]_
  - bartenderId: _ObjectId_
  - avatar: _object_
    - imgName: _string_
    - imgPath: _string_
  - username: _string_
  
- favCocktails: _[objectId, ref: cocktails]_

- role: _string_

  

> __Bartender__

- id: _string_

- username: _string_

- email: _string_

- password: _string_

- avatar: _object_
  - imgName: _string_
  - imgPath: _string_
  
- personalInfo: _object_
  - firstName: _string_
  - lastName: _string_
  - phone: _string__
  - description: _string_

- experience: _[object]_
  - place: _string_
  - from: _date_
  - until: _date_
  - position: _string_
  
- personalCocktails: _[object]_
  - cocktailId: _ObjectId_
  - name: _string_
  - category: _string_
  - image: _object_
    - imgName: _string_
    - imgPath: _string_

- raiting: _number_

- role: _string_

  

> __Comment__

- id: _string_

- text: _string_

- author: _object_
  - authorId: _ObjectId_
  - username:  _string_
  - role: _string_
  
- recipient: _object_
  - restaurantId: _ObjectId_
  - name: _string_
  - city: _string_

  

> __Cocktail__

- id: _string_

- name: _string_

- glass: _string_

- category: _string_

- ingredients: [_object_]
  - unit: _string_
  - amount: _number_
  - ingredientName: _string_
  - label: _string_

- garnish: _string_

- preparation: _string_

- isIBA: _boolean_

- image : _object_
  - imgName: _string_
  - imgPath: _string_

- owner: _object_
  - bartenderId: _ObjectId_
  - username: _string_
  - avatar: _object_
    - imgName: _string_
    - imgPath: _string_

- likes: _object_
  - likeId: _ObjectId_
  - customerId: _ObjectId_
  - username: _string_
  - avatar: _object_
    - imgName: _string_
    - imgPath: _string_
  
  

> __Like__

- id: _string_
- customerId: _ObjectId_
- cocktailId: _ObjectId_



## End points

__api/auth__
- _post_ restaurants/login => login as a restaurant user
- _post_ customers/login => login as a customer user
- _post_ bartenders/login => login as a bartender user

__api/restaurants__
- _get_ / => list all restaurants
- _get_ /me => list my restaurant profile
- _get_ /:id => list one restaurant profile
- _put_ /:id/rate => rate the restaurant 
- _post_ / => create one restaurant user
- _put_ /me => edit my restaurant profile
- _put_ /me/change-password => edit password
- _put_ /me/add-photo => add photo to the restaurant gallery
- _delete_ /me/remove-photo/:photo_id => remove photo from the gallery
- _delete_ /me => delete restaurant user

__api/bartenders__
- _get_ / => list all bartenders
- _get_ /me => list my bartender profile
- _get_ /:id => list one bartender profile
- _post_ / => create one bartender user
- _put_ /me => edit my bartender profile
- _put_ /me/change-password => edit password
- _put_ /me/set-avatar => set/edit avatar
- _put_ /me/add-experience => add experience to the profile
- _delete_ /me/remove-experience/:experienceId => remove experience from the profile
- _delete_ /me/ => remove bartender profile

__api/customers__
- _get_ / => list all customers
- _get_ /me => list my customer profile
- _get_ /:id => list one customer profile
- _post_ / => create one customer user
- _put_ /me => edit my customer profile
- _put_ /me/change-password => edit password
- _put_ /me/set-avatar => set/edit avatar
- _put_ /me/add-fav_restaurants/:restaurantId => add a restaurant to favorites
- _delete_ /me/remove-fav_restaurants/:restaurantId => remove a restaurant from favorites
- _put_ /me/add-fav_bartenders/:bartenderId => add a bartender to favorites
- _delete_ /me/remove-fav_bartenders/:bartenderId => remove a bartender from favorites
- _delete_ /me/ => remove customer profile

__api/comments__
- _get_ / => list all comments
- _get_ /:id => list one comment
- _post_ / => create a comment
- _put_ /:id => edit a comment
- _delete_ /:id => delete a comment

__api/cocktails__
- _get_ / => list all cocktails
- _get_ /:id => list one cocktail
- _post_ / => create one cocktail
- _put_ /:id/set-image => set/edit the cocktail's image
- _delete_ /:id => delete one cocktail

__api/likes__
- _get_ / => list all likes
- _post_ / => give a like
- _delete_ / => remove a like




