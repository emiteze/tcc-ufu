# tcc-ufu

### AWS Accounts

### Dev

AWS Account Id: 760347630853 \
AWS Account Name: TCC-UFU-Dev \
AWS Email: emiteze+dev@hotmail.com

### Prod

AWS Account Id: 131204617414 \
AWS Account Name: TCC-UFU-Prod \
AWS Email: emiteze+prod@hotmail.com

## API

### Create Customer

#### POST /customers

Input:

```json
{
    "name": "John Doe",
    "email": "john.doe@gmail.com"
}
```

Output:

```json
{
    "id": "9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1",
    "name": "John Doe",
    "email": "john.doe@gmail.com"
}
```

### Get Customer

#### GET /customers/9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1

Output:

```json
{
    "id": "9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1",
    "name": "John Doe",
    "email": "john.doe@gmail.com"
}
```

### Get All Customers

#### GET /customers

Output:

```json
[
    {
        "id": "9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1",
        "name": "John Doe",
        "email": "john.doe@gmail.com"
    }
]
```

### Update Customer

#### PUT /customers/9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1

Input:

```json
{
    "name": "John Doe 2",
    "email": "john.doe@gmail.com"
}
```

Output:

```json
{
    "id": "9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1",
    "name": "John Doe 2",
    "email": "john.doe@gmail.com"
}
```

### Delete Customer

#### DELETE /customers/9e61b8d0-2faf-4ef8-ac0a-78d1338e57f1

Output:

```json
{
    "message": "Customer deleted successfully"
}
```