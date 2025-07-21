<!DOCTYPE html>
<html>
<head>
    <title>Company PDF</title>
    <style>
        body { font-family: sans-serif; }
    </style>
</head>
<body>
    <h1>{{ $company->company_name }}</h1>
    <p><strong>ID:</strong> {{ $company->company_id }}</p>
    <p><strong>Address:</strong> {{ $company->address }}</p>
    <!-- Add more fields as needed -->
</body>
</html>
