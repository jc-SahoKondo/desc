# UsersApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**usersPost**](UsersApi.md#usersPost) | **POST** /users | ユーザ登録 |
| [**usersUserIdDelete**](UsersApi.md#usersUserIdDelete) | **DELETE** /users/{userId} | ユーザ削除 |


<a name="usersPost"></a>
# **usersPost**
> ResponseMessage usersPost(UserRequest)

ユーザ登録

    新しいユーザを登録します

### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **UserRequest** | [**UserRequest**](../Models/UserRequest.md)|  | |

### Return type

[**ResponseMessage**](../Models/ResponseMessage.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="usersUserIdDelete"></a>
# **usersUserIdDelete**
> ResponseMessage usersUserIdDelete(userId)

ユーザ削除

    指定したユーザIDのユーザを削除します

### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **userId** | **String**| 削除対象のユーザID | [default to null] |

### Return type

[**ResponseMessage**](../Models/ResponseMessage.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

