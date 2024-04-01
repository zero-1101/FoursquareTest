namespace FoursquareTest.Extensions
{
    public static class ConfigurationExtensions
    {
        public static string GetDbDirectory(this IConfiguration configuration)
        {
            string dbDirectory = configuration.GetValue<string>("DatabaseDirectory");
            return dbDirectory;
        }

        public static string GetSqLiteConnectionString(this IConfiguration configuration)
        {
            string sqLiteConnectionString = configuration.GetConnectionString("SqLiteConnection") ?? "";
            return sqLiteConnectionString;
        }
    }
}
