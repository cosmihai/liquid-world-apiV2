
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
  
- role: _string_

  

> __Bartender__

- id: _string_

- username: _string_

- email: _string_

- password: _string_

- avatar: _object_
  - imgName: _string_
  - imgPath: _string_
  
- description: _string_

- personalInfo: _object_
  - firstName: _string_
  - lastName: _string_
  - phone: _number_
  - experience: _[object]_
    - place: _string_
    - from: _date_
    - until: _date_
    - position: _string_
  
- personalCocktails: _[object]_

  - cocktailId: _ObjectId_
  - name: _string_
  - category: _string_
  - likes

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

- likes: _object_

  - count: _number_
  - customerId: _ObjectId_
  - customerUsername: _string_
  - likeId: _ObjectId_
  
  

> __Like__

- id: _string_
- customerId: _ObjectId_
- cocktailId: _ObjectId_



## End points

__api/restaurants__
- _get_ /
- _get_ /:id
- _post_ /
- _put_ /:id
- _put_ /:id/change-password
- _put_ /:id/add-photo
- _delete_ /:id/remove-photo/:photo_id
- _put_ /:id/rate
- _delete_ /:id

__api/restaurants/:id__

__api/bartenders__

__api/bartenders/:id__

__api/comments__

__api/comments/:id__

__api/cocktails__

__api/cocktails/:id__

__api/likes__

__api/likes/:id__



