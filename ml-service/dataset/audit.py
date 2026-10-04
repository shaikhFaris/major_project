import pandas as pd

df = pd.read_csv('all_car_details.csv')

print('=== UNIQUE CITIES ({}) ==='.format(df['city'].nunique()))
print(sorted(df['city'].unique()))

print('\n=== UNIQUE MAKES ({}) ==='.format(df['make'].nunique()))
print(sorted(df['make'].unique()))

print('\n=== FUEL TYPES ===')
print(df['fuel_type'].value_counts())

print('\n=== BODY TYPES ===')
print(df['body_type'].value_counts())

print('\n=== TRANSMISSIONS ===')
print(df['transmission'].value_counts())

print('\n=== OWNERS DISTRIBUTION ===')
print(df['no_of_owners'].value_counts())

print('\n=== MAKE YEAR RANGE ===')
print('Min:', df['make_year'].min(), ' Max:', df['make_year'].max())

print('\n=== PRICE STATS (INR) ===')
print('Min:', f"{df['price'].min():,.0f}")
print('Max:', f"{df['price'].max():,.0f}")
print('Mean:', f"{df['price'].mean():,.0f}")
print('Median:', f"{df['price'].median():,.0f}")

print('\n=== MILEAGE STATS (km) ===')
print('Min:', f"{df['mileage'].min():,.0f}")
print('Max:', f"{df['mileage'].max():,.0f}")
print('Mean:', f"{df['mileage'].mean():,.0f}")
print('Median:', f"{df['mileage'].median():,.0f}")

print('\n=== DUPLICATE ROWS ===')
print('Duplicates:', df.duplicated().sum())

print('\n=== PUBLICATION DATE RANGE ===')
df['pub_date'] = pd.to_datetime(df['latest_publish_date'])
print('Earliest:', df['pub_date'].min())
print('Latest:', df['pub_date'].max())

print('\n=== TOP 15 MODELS BY LISTING COUNT ===')
print(df['model'].value_counts().head(15))

print('\n=== TOP 10 CITIES BY LISTING COUNT ===')
print(df['city'].value_counts())

print('\n=== PRICE BY CITY (MEAN) ===')
print(df.groupby('city')['price'].mean().sort_values(ascending=False).apply(lambda x: f"{x:,.0f}"))

print('\n=== PRICE BY FUEL TYPE ===')
print(df.groupby('fuel_type')['price'].agg(['mean','median','count']).sort_values('count', ascending=False))

print('\n=== VEHICLE AGE DERIVED ===')
df['vehicle_age'] = 2025 - df['make_year']
print(df['vehicle_age'].describe())

print('\n=== PRICE BY BODY TYPE ===')
print(df.groupby('body_type')['price'].agg(['mean','median','count']).sort_values('count', ascending=False))
